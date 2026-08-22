import { describe, it, expect } from "vitest";
import {
  dispatchMcpMessage,
  MCP_PROTOCOL_VERSION,
  type McpDataProvider,
  type McpTool,
} from "../../src/lib/mcp/protocol";

const fakeProvider: McpDataProvider = {
  tools: () =>
    [
      { name: "echo", description: "Echo tool" },
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: { a: { type: "number" }, b: { type: "number" } },
        },
      },
    ] as McpTool[],
  call: async (name, args) => {
    if (name === "echo")
      return { echoed: (args as { value?: unknown }).value ?? null };
    if (name === "add") {
      const { a, b } = args as { a?: number; b?: number };
      return { sum: Number(a ?? 0) + Number(b ?? 0) };
    }
    throw new Error(`Unknown tool: ${name}`);
  },
};

async function dispatch(payload: unknown, version: string | null = null) {
  return dispatchMcpMessage(payload, fakeProvider, version);
}

describe("MCP JSON-RPC dispatch", () => {
  it("answers initialize with the negotiated protocol version", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2026-01-01",
        capabilities: {},
        clientInfo: { name: "t", version: "1" },
      },
    });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    const res = out.message.result as {
      protocolVersion: string;
      capabilities: { tools: object };
      serverInfo: { name: string };
    };
    expect(res.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
    expect(res.capabilities.tools).toBeDefined();
    expect(res.serverInfo.name).toBe("ar27111994.dev");
  });

  it("rejects an unsupported MCP-Protocol-Version header value", async () => {
    const out = await dispatch(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      "1999-01-01",
    );
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    expect(out.message.error?.code).toBe(-32600);
  });

  it("answers ping", async () => {
    const out = await dispatch({ jsonrpc: "2.0", id: 2, method: "ping" });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    expect(out.message.result).toEqual({});
  });

  it("treats notifications/initialized as an ack (no response)", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    expect(out.kind).toBe("ack");
  });

  it("lists tools with schemas", async () => {
    const out = await dispatch({ jsonrpc: "2.0", id: 3, method: "tools/list" });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    const { tools } = out.message.result as { tools: McpTool[] };
    expect(tools.map((t) => t.name)).toEqual(["echo", "add"]);
    expect(tools[1].inputSchema).toBeDefined();
  });

  it("calls tools and wraps results in text content", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "add", arguments: { a: 2, b: 3 } },
    });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    const { content, isError } = out.message.result as {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
    expect(isError).toBeFalsy();
    expect(content[0].type).toBe("text");
    expect(JSON.parse(content[0].text)).toEqual({ sum: 5 });
  });

  it("reports tool errors as isError results, not protocol errors", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "nope", arguments: {} },
    });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    expect((out.message.result as { isError?: boolean }).isError).toBe(true);
    expect(out.message.error).toBeUndefined();
  });

  it("returns method-not-found for unknown methods", async () => {
    const out = await dispatch({ jsonrpc: "2.0", id: 6, method: "bogus" });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    expect(out.message.error?.code).toBe(-32601);
  });

  it("returns invalid-request for non-JSON-RPC payloads", async () => {
    const out = await dispatch({ hello: "world" });
    expect(out.kind).toBe("invalid");
    if (out.kind !== "invalid") return;
    expect(out.message.error?.code).toBe(-32600);
  });

  it("returns invalid-params when the tool name is missing", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {},
    });
    expect(out.kind).toBe("response");
    if (out.kind !== "response") return;
    expect(out.message.error?.code).toBe(-32602);
  });

  it("acks notifications even when they fail (no response for notifications)", async () => {
    const out = await dispatch({
      jsonrpc: "2.0",
      method: "some/notification",
    });
    expect(out.kind).toBe("ack");
  });
});
