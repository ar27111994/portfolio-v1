import type { APIRoute } from "astro";
import { privacyMarkdown } from "../../lib/markdown/pages";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(privacyMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
