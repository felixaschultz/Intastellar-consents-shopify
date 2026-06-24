/**
 * Run against production-like env vars to pinpoint demo-store provisioning failures.
 *
 *   npm run diagnose:pilot
 *
 * Loads `.env` when present. Never prints secret values.
 */
import fs from "node:fs";
import path from "node:path";
import {
  isPilotStoreAuthConfigured,
  readPartnerOrganizationId,
  resolveBusinessPlatformAccessToken,
  businessPlatformAuthHeaders,
} from "../app/lib/shopify-business-platform-auth.server";

function loadDotEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    /* ignore */
  }
}

loadDotEnv();

const BP_FQDN = "destinations.shopifysvc.com";

function mask(value: string | undefined | null): string {
  if (!value?.trim()) return "(not set)";
  const t = value.trim();
  if (t.length <= 8) return "****";
  return `${t.slice(0, 4)}…${t.slice(-4)} (${t.length} chars)`;
}

function credentialSource(): string {
  if (process.env.SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN?.trim()) {
    return "partner identity (SHOPIFY_PARTNER_IDENTITY_*)";
  }
  if (process.env.SHOPIFY_APP_AUTOMATION_TOKEN?.trim()) {
    return "app automation token (SHOPIFY_APP_AUTOMATION_TOKEN)";
  }
  if (process.env.SHOPIFY_CLI_PARTNERS_TOKEN?.trim()) {
    return "CLI partners token (SHOPIFY_CLI_PARTNERS_TOKEN)";
  }
  if (process.env.SHOPIFY_BUSINESS_PLATFORM_TOKEN?.trim()) {
    return "direct business platform token (SHOPIFY_BUSINESS_PLATFORM_TOKEN)";
  }
  return "none";
}

async function main() {
  console.log("Pilot demo-store provisioning diagnostics\n");

  console.log("Environment");
  console.log(`  SHOPIFY_PARTNER_ORG_ID: ${readPartnerOrganizationId() ?? "(not set)"}`);
  console.log(`  Credential source: ${credentialSource()}`);
  console.log(`  SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN: ${mask(process.env.SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN)}`);
  console.log(`  SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN: ${mask(process.env.SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN)}`);
  console.log(`  SHOPIFY_APP_AUTOMATION_TOKEN: ${mask(process.env.SHOPIFY_APP_AUTOMATION_TOKEN)}`);
  console.log(`  SHOPIFY_PILOT_STORE_PLAN_KEY: ${process.env.SHOPIFY_PILOT_STORE_PLAN_KEY?.trim() || "SHOPIFY_PLUS_APP_DEVELOPMENT (default)"}`);
  console.log(`  Configured: ${isPilotStoreAuthConfigured() ? "yes" : "no"}\n`);

  if (!isPilotStoreAuthConfigured()) {
    console.error(
      "FAIL: Set SHOPIFY_PARTNER_ORG_ID plus partner identity tokens (recommended) or SHOPIFY_APP_AUTOMATION_TOKEN.",
    );
    process.exit(1);
  }

  console.log("Step 1: Resolve Business Platform access token…");
  let accessToken: string;
  try {
    accessToken = await resolveBusinessPlatformAccessToken();
    console.log(`  OK — token ${mask(accessToken)}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL — ${message}\n`);
    console.error(
      "Likely cause: expired partner identity tokens or an App Automation Token that cannot be exchanged for store-management scopes.\n" +
        "Fix: run `shopify auth login`, copy fresh SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN + SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN to Vercel.\n" +
        "Org id from CLI: jq -r '.[\"/path/to/app\"].orgId' ~/Library/Preferences/shopify-cli-app-nodejs/config.json",
    );
    process.exit(1);
  }

  const organizationId = readPartnerOrganizationId()!;
  const url = `https://${BP_FQDN}/organizations/api/unstable/organization/${organizationId}/graphql`;
  console.log("Step 2: Ping Business Platform Organizations API…");

  const res = await fetch(url, {
    method: "POST",
    headers: businessPlatformAuthHeaders(accessToken),
    body: JSON.stringify({
      query: `query { organization { id } }`,
    }),
  });

  const text = await res.text();
  console.log(`  HTTP ${res.status}`);

  if (!res.ok) {
    console.error(`  FAIL — body: ${text.slice(0, 400) || "(empty)"}\n`);
    if (res.status === 400) {
      console.error(
        "HTTP 400 usually means wrong SHOPIFY_PARTNER_ORG_ID or malformed auth. Verify org id matches partners.shopify.com/ORG_ID/…",
      );
    }
    process.exit(1);
  }

  let json: { data?: { organization?: { id?: string } }; errors?: { message?: string }[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    console.error(`  FAIL — non-JSON response: ${text.slice(0, 200)}`);
    process.exit(1);
  }

  if (json.errors?.length) {
    console.error(`  FAIL — GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
    process.exit(1);
  }

  console.log(`  OK — organization id ${json.data?.organization?.id ?? "(unknown)"}\n`);
  console.log("All checks passed. Demo store creation should work; if it still fails, check Vercel function logs for [pilot] store error.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
