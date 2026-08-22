/**
 * Minimal Model Context Protocol (Streamable HTTP) JSON-RPC core.
 *
 * Implements the 2025-06-18 spec's happy path for a read-only tools server:
 * initialize / notifications/initialized / ping / tools/list / tools/call,
 * JSON-RPC error codes, and version negotiation. Transport-agnostic: the
 * endpoint (src/pages/mcp.ts) maps HTTP <-> this layer.
 *
 * Data access is injected via McpDataProvider so the protocol can be unit
 * tested without importing the site data layer.
 */

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const SUPPORTED_PROTOCOL_VERSIONS = [
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
] as const;

export const SERVER_INFO = {
  name: "ar27111994.dev",
  title: "Ahmed Rehan — ARLabs portfolio data",
  version: "1.0.0",
} as const;

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

/** Shape every tool handler must satisfy (dictionary args, JSON-safe result). */
export type McpToolHandler = (
  args: Record<string, unknown>,
) => Record<string, unknown> | Promise<Record<string, unknown>>;

export interface McpDataProvider {
  tools: () => McpTool[];
  /** Returns the raw JSON-serializable payload for a tool call. */
  call: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export type McpRequestMessage = {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: unknown;
};

export type McpResultMessage = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type McpDispatch =
  | { kind: "response"; message: McpResultMessage }
  | { kind: "ack" } // notification accepted (HTTP 202)
  | { kind: "invalid"; message: McpResultMessage };

const ERROR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

// JSON-RPC 2.0 error messages (spec text, not free-form copy).
const ERROR_MESSAGE: Record<number, string> = {
  [ERROR.PARSE]: "Parse error",
  [ERROR.INVALID_REQUEST]: "Invalid Request",
  [ERROR.METHOD_NOT_FOUND]: "Method not found",
  [ERROR.INVALID_PARAMS]: "Invalid params",
  [ERROR.INTERNAL]: "Internal error",
};

export function errorResult(
  id: string | number | null,
  code: number,
  message?: string,
  data?: unknown,
): McpResultMessage {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message: message ?? ERROR_MESSAGE[code] ?? "Error",
      ...(data !== undefined ? { data } : {}),
    },
  };
}

export function resultMessage(
  id: string | number,
  result: unknown,
): McpResultMessage {
  return { jsonrpc: "2.0", id, result };
}

/**
 * Dispatch a single MCP JSON-RPC message and return the appropriate outcome
 * per the Streamable HTTP spec:
 * - requests -> JSON-RPC response
 * - notifications -> ack (HTTP 202 Accepted, no body)
 * - malformed -> invalid (HTTP error response carrying a JSON-RPC error)
 */
export async function dispatchMcpMessage(
  message: unknown,
  provider: McpDataProvider,
  requestedVersion: string | null,
): Promise<McpDispatch> {
  if (
    !message ||
    typeof message !== "object" ||
    (message as { jsonrpc?: unknown }).jsonrpc !== "2.0"
  ) {
    return {
      kind: "invalid",
      message: errorResult(null, ERROR.INVALID_REQUEST),
    };
  }

  const req = message as McpRequestMessage;
  const isNotification = req.id === undefined;

  try {
    const handled = await handleMethod(req, provider, requestedVersion);
    if (isNotification) return { kind: "ack" };
    return { kind: "response", message: handled };
  } catch (err) {
    const code =
      err instanceof McpMethodError
        ? err.code
        : err instanceof McpParamsError
          ? ERROR.INVALID_PARAMS
          : ERROR.INTERNAL;
    const message = err instanceof Error ? err.message : "Error";
    if (isNotification) return { kind: "ack" };
    return {
      kind: "response",
      message: errorResult(req.id ?? null, code, message),
    };
  }
}

class McpMethodError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

class McpParamsError extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function handleMethod(
  req: McpRequestMessage,
  provider: McpDataProvider,
  requestedVersion: string | null,
): Promise<McpResultMessage> {
  const id = req.id ?? null;
  switch (req.method) {
    case "initialize": {
      if (
        requestedVersion &&
        !SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion as never)
      ) {
        throw new McpMethodError(
          ERROR.INVALID_REQUEST,
          `Unsupported protocol version: ${requestedVersion}`,
        );
      }
      return resultMessage(id ?? 0, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }
    case "ping":
      return resultMessage(id ?? 0, {});
    case "tools/list": {
      const tools = provider.tools();
      return resultMessage(id ?? 0, { tools });
    }
    case "tools/call": {
      const params = (req.params ?? {}) as Record<string, unknown>;
      const name = params.name;
      if (typeof name !== "string" || !name) {
        throw new McpParamsError("Missing tool name");
      }
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      let payload: unknown;
      try {
        payload = await provider.call(name, args);
      } catch (err) {
        return resultMessage(id ?? 0, {
          content: [
            {
              type: "text",
              text: err instanceof Error ? err.message : "Tool error",
            },
          ],
          isError: true,
        });
      }
      return resultMessage(id ?? 0, {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      });
    }
    case "notifications/initialized":
      // Handled as a notification at the dispatch layer; if it arrives with
      // an id (odd but legal), acknowledge it.
      return resultMessage(id ?? 0, {});
    case undefined:
      throw new McpMethodError(ERROR.INVALID_REQUEST, "Method required");
    default:
      throw new McpMethodError(ERROR.METHOD_NOT_FOUND, "Method not found");
  }
}

// NOTE: HTTP-level parsing (body -> JSON, -32700 on failure) lives in the
// endpoint (src/pages/mcp.ts); dispatchMcpMessage expects valid JSON-RPC
// objects and maps non-conforming ones to -32600 Invalid Request.
