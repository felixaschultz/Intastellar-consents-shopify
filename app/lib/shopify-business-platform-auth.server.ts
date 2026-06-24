/**
 * Resolves a Business Platform API access token for pilot dev-store creation.
 *
 * Supports:
 * - SHOPIFY_APP_AUTOMATION_TOKEN (Dev Dashboard → App → Settings) — recommended for Vercel
 * - SHOPIFY_BUSINESS_PLATFORM_TOKEN — short-lived CLI session token, or atkn_* (auto-exchanged)
 */

const IDENTITY_TOKEN_URL = "https://accounts.shopify.com/oauth/token";
/** Shopify CLI production OAuth client (public, same for all partners). */
const SHOPIFY_CLI_CLIENT_ID = "fbdb2649-e327-4907-8f67-908d24cfd7e3";
/** Business Platform API audience id (production). */
const BUSINESS_PLATFORM_AUDIENCE = "32ff8ee5-82b8-4d93-9f8a-c6997cefb7dc";

/** Scopes requested during automation-token exchange (matches Shopify CLI). */
const BUSINESS_PLATFORM_EXCHANGE_SCOPE =
  "https://api.shopify.com/auth/destinations.readonly";

type CachedToken = { accessToken: string; expiresAtMs: number };

let cachedAccessToken: CachedToken | null = null;

export function isAppAutomationToken(token: string): boolean {
  return token.trim().startsWith("atkn_");
}

function readAutomationTokenFromEnv(): string | null {
  const automation =
    process.env.SHOPIFY_APP_AUTOMATION_TOKEN?.trim() ||
    process.env.SHOPIFY_CLI_PARTNERS_TOKEN?.trim();
  if (automation) return automation;

  const legacy = process.env.SHOPIFY_BUSINESS_PLATFORM_TOKEN?.trim();
  if (legacy && isAppAutomationToken(legacy)) return legacy;
  return null;
}

function readDirectBusinessPlatformToken(): string | null {
  const direct = process.env.SHOPIFY_BUSINESS_PLATFORM_TOKEN?.trim();
  if (!direct || isAppAutomationToken(direct)) return null;
  return direct;
}

export function readPartnerOrganizationId(): string | null {
  return (
    process.env.SHOPIFY_PARTNER_ORG_ID?.trim() ||
    process.env.SHOPIFY_ORGANIZATION?.trim() ||
    null
  );
}

export function isPilotStoreAuthConfigured(): boolean {
  return Boolean(readPartnerOrganizationId() && getRawCredentialToken());
}

function getRawCredentialToken(): string | null {
  return readAutomationTokenFromEnv() ?? readDirectBusinessPlatformToken();
}

async function exchangeAutomationToken(
  automationToken: string,
): Promise<CachedToken> {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
    subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
    client_id: SHOPIFY_CLI_CLIENT_ID,
    audience: BUSINESS_PLATFORM_AUDIENCE,
    scope: BUSINESS_PLATFORM_EXCHANGE_SCOPE,
    subject_token: automationToken,
  });

  const res = await fetch(IDENTITY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  let payload: {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  try {
    payload = JSON.parse(text) as typeof payload;
  } catch {
    throw new Error(
      `Token exchange failed (${res.status}): ${text.slice(0, 200) || "empty response"}`,
    );
  }

  if (!res.ok || !payload.access_token) {
    const detail =
      payload.error_description ?? payload.error ?? text.slice(0, 200);
    const invalidSubject =
      typeof detail === "string" &&
      detail.toLowerCase().includes("subject_token");
    const hint = invalidSubject
      ? "Your App Automation Token is expired, revoked, or was copied incorrectly. " +
        "Create a new one in Dev Dashboard → Intastellar Consents → Settings → App automation token, " +
        "then set SHOPIFY_APP_AUTOMATION_TOKEN (not SHOPIFY_BUSINESS_PLATFORM_TOKEN) on Vercel."
      : "Create a new token in Dev Dashboard → your app → Settings → App automation token " +
        "and set SHOPIFY_APP_AUTOMATION_TOKEN.";
    throw new Error(
      `App Automation Token could not be exchanged for Business Platform access (${res.status}): ${detail}. ${hint}`,
    );
  }

  const expiresInSec =
    typeof payload.expires_in === "number" && payload.expires_in > 0
      ? payload.expires_in
      : 3600;
  return {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000 - 60_000,
  };
}

/** Returns a valid Business Platform access token (cached until near expiry). */
export async function resolveBusinessPlatformAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > Date.now()) {
    return cachedAccessToken.accessToken;
  }

  const automation = readAutomationTokenFromEnv();
  if (automation) {
    cachedAccessToken = await exchangeAutomationToken(automation);
    return cachedAccessToken.accessToken;
  }

  const direct = readDirectBusinessPlatformToken();
  if (direct) return direct;

  throw new Error(
    "Pilot store provisioning is not configured. Set SHOPIFY_APP_AUTOMATION_TOKEN (recommended) " +
      "or a CLI session SHOPIFY_BUSINESS_PLATFORM_TOKEN, plus SHOPIFY_PARTNER_ORG_ID.",
  );
}
