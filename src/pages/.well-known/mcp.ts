import { mcpManifestResponse } from "../../lib/mcp/well-known";

export const prerender = true;

export const GET = () => mcpManifestResponse();
