/**
 * Operator notifications when a visitor requests a pilot demo store.
 *
 * Uses Resend (https://resend.com) — no extra npm dependency.
 *
 *   PILOT_OPERATOR_EMAIL  — your inbox (required for signup to be enabled)
 *   RESEND_API_KEY        — Resend API key
 *   PILOT_EMAIL_FROM      — optional verified sender (default: Intastellar Consents <notifications@consentsmanagement.com>)
 *   PILOT_OPERATOR_SECRET — optional secret for "mark store ready" links in the email
 */

import type { PilotLead } from "@prisma/client";
import { publicSiteBase } from "./shopify-app-seo";

export function isPilotSignupConfigured(): boolean {
  return Boolean(
    process.env.PILOT_OPERATOR_EMAIL?.trim() &&
      process.env.RESEND_API_KEY?.trim(),
  );
}

function operatorEmail(): string | null {
  const email = process.env.PILOT_OPERATOR_EMAIL?.trim();
  return email || null;
}

function emailFrom(): string {
  return (
    process.env.PILOT_EMAIL_FROM?.trim() ||
    "Intastellar Consents <notifications@consentsmanagement.com>"
  );
}

function operatorSecret(): string | null {
  return process.env.PILOT_OPERATOR_SECRET?.trim() || null;
}

function buildCompleteUrl(leadId: string, shopDomain: string): string | null {
  const secret = operatorSecret();
  if (!secret) return null;
  const url = new URL("/pilot-lead/complete", publicSiteBase());
  url.searchParams.set("secret", secret);
  url.searchParams.set("id", leadId);
  url.searchParams.set("shop", shopDomain);
  return url.toString();
}

function formatLeadEmailHtml(lead: Pick<PilotLead, "id" | "email" | "storeName" | "currentCmp" | "createdAt">): string {
  const created = lead.createdAt.toISOString();
  const partnerStoresUrl = "https://partners.shopify.com/current/stores";
  const completeExample = buildCompleteUrl(lead.id, "your-store.myshopify.com");
  const completeHint = completeExample
    ? `<p>After you create the store, open this link (replace the shop domain if needed):</p>
       <p><a href="${escapeHtml(completeExample)}">${escapeHtml(completeExample)}</a></p>`
    : `<p>After you create the store, set <code>PILOT_OPERATOR_SECRET</code> and use <code>/pilot-lead/complete</code>, or update the <code>PilotLead</code> row in the database (<code>shopDomain</code>, <code>status=READY</code>).</p>`;

  return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <h2>New pilot demo request</h2>
  <table cellpadding="6" style="border-collapse: collapse;">
    <tr><td><strong>Email</strong></td><td>${escapeHtml(lead.email)}</td></tr>
    <tr><td><strong>Store name</strong></td><td>${escapeHtml(lead.storeName)}</td></tr>
    <tr><td><strong>Current CMP</strong></td><td>${escapeHtml(lead.currentCmp)}</td></tr>
    <tr><td><strong>Lead ID</strong></td><td><code>${escapeHtml(lead.id)}</code></td></tr>
    <tr><td><strong>Submitted</strong></td><td>${escapeHtml(created)}</td></tr>
  </table>
  <h3>Next steps</h3>
  <ol>
    <li>Create a <strong>development store</strong> in the <a href="${partnerStoresUrl}">Partner Dashboard</a> named &ldquo;${escapeHtml(lead.storeName)}&rdquo;.</li>
    <li>Install <strong>Intastellar Consents</strong> on that store (or let the user approve OAuth).</li>
    <li>Mark the lead ready so the visitor gets the demo-ready email via Intastellar Accounts.</li>
  </ol>
  ${completeHint}
</body>
</html>`;
}

function formatLeadEmailText(lead: Pick<PilotLead, "id" | "email" | "storeName" | "currentCmp" | "createdAt">): string {
  return [
    "New pilot demo request",
    "",
    `Email: ${lead.email}`,
    `Store name: ${lead.storeName}`,
    `Current CMP: ${lead.currentCmp}`,
    `Lead ID: ${lead.id}`,
    `Submitted: ${lead.createdAt.toISOString()}`,
    "",
    "Create a development store in the Partner Dashboard, install the app, then mark the lead ready.",
    buildCompleteUrl(lead.id, "your-store.myshopify.com") ??
      "Set PILOT_OPERATOR_SECRET and use /pilot-lead/complete, or update PilotLead in the database.",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type OperatorNotifyResult =
  | { ok: true }
  | { ok: false; message: string };

/** Email the operator that a new pilot lead needs a dev store. */
export async function notifyOperatorOfPilotLead(
  lead: Pick<PilotLead, "id" | "email" | "storeName" | "currentCmp" | "createdAt">,
): Promise<OperatorNotifyResult> {
  const to = operatorEmail();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!to || !apiKey) {
    return {
      ok: false,
      message: "PILOT_OPERATOR_EMAIL and RESEND_API_KEY must be set",
    };
  }

  const subject = `Pilot demo request: ${lead.storeName}`;
  const html = formatLeadEmailHtml(lead);
  const text = formatLeadEmailText(lead);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [to],
        subject,
        html,
        text,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, message };
  }

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      message: `Resend API ${response.status}: ${body.slice(0, 300)}`,
    };
  }

  return { ok: true };
}

export { buildCompleteUrl };
