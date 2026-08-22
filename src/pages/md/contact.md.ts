import type { APIRoute } from "astro";
import { contactMarkdown } from "../../lib/markdown/pages";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(contactMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
