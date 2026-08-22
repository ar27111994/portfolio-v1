import type { APIRoute } from "astro";
import { workMarkdown } from "../../lib/markdown/pages";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(workMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
