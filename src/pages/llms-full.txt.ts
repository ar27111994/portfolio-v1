import type { APIRoute } from "astro";
import { llmsFullText } from "../lib/markdown/pages";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(llmsFullText(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
