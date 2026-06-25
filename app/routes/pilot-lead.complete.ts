import type { LoaderFunctionArgs } from "@remix-run/node";
import { markPilotLeadReady } from "../lib/pilot-lead.server";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlPage(
  title: string,
  body: string,
  init?: { status?: number },
): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; }
    a { color: #1a5fb4; }
  </style>
</head>
<body>${body}</body>
</html>`,
    {
      status: init?.status ?? 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret")?.trim();
  const leadId = url.searchParams.get("id")?.trim();
  const shop = url.searchParams.get("shop")?.trim();

  const expectedSecret = process.env.PILOT_OPERATOR_SECRET?.trim();
  if (!expectedSecret) {
    return htmlPage(
      "Pilot lead — not configured",
      "<h1>Not configured</h1><p>Set <code>PILOT_OPERATOR_SECRET</code> on the server to use this link.</p>",
    );
  }

  if (!secret || secret !== expectedSecret) {
    return htmlPage(
      "Pilot lead — unauthorized",
      "<h1>Unauthorized</h1><p>Invalid or missing secret.</p>",
      { status: 403 },
    );
  }

  if (!leadId || !shop) {
    return htmlPage(
      "Pilot lead — missing parameters",
      "<h1>Missing parameters</h1><p>Provide <code>id</code> (lead ID) and <code>shop</code> (myshopify.com domain).</p>",
      { status: 400 },
    );
  }

  const result = await markPilotLeadReady(leadId, shop);
  if (!result.ok) {
    return htmlPage(
      "Pilot lead — error",
      `<h1>Could not mark ready</h1><p>${escapeHtml(result.message)}</p>`,
      { status: 400 },
    );
  }

  return htmlPage(
    "Pilot lead ready",
    `<h1>Demo store marked ready</h1>
     <p>Visitor <strong>${escapeHtml(result.email)}</strong> will receive the demo-ready email (if Intastellar Accounts is configured).</p>
     <p>Install link: <a href="${escapeHtml(result.installUrl)}">${escapeHtml(result.installUrl)}</a></p>`,
  );
};
