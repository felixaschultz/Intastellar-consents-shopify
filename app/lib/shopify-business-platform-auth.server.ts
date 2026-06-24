/**
 * Resolves a Business Platform API access token for pilot dev-store creation.
 *
 * Production (Vercel) — recommended:
 * - SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN (+ SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN)
 *   from `shopify auth login` CLI session identity (long-lived refresh flow)
 * - or SHOPIFY_APP_AUTOMATION_TOKEN (Dev Dashboard → App → Settings), exchanged server-side
 *
 * Local dev:
 * - SHOPIFY_BUSINESS_PLATFORM_TOKEN — fresh CLI Business Platform application token
 *   (not the raw atkn_* automation token)
 */

const IDENTITY_TOKEN_URL = "https://accounts.shopify.com/oauth/token";
/** Shopify CLI production OAuth client (public, same for all partners). */
const SHOPIFY_CLI_CLIENT_ID = "fbdb2649-e327-4907-8f67-908d24cfd7e3";
/** Business Platform API audience id (production). */
const BUSINESS_PLATFORM_AUDIENCE = "32ff8ee5-82b8-4d93-9f8a-c6997cefb7dc";

const BUSINESS_PLATFORM_SCOPES = [
  "https://api.shopify.com/auth/destinations.readonly",
  "https://api.shopify.com/auth/organization.store-management",
  "https://api.shopify.com/auth/organization.on-demand-user-access",
].join(" ");

type CachedToken = { accessToken: string; expiresAtMs: number };

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

let cachedAccessToken: CachedToken | null = null;

export function isAppAutomationToken(token: string): boolean {
  return token.trim().startsWith("atkn_");
}

/** CLI sends Business Platform tokens as `Bearer <token>` (see Shopify CLI buildHeaders). */
export function formatBusinessPlatformAuthValue(accessToken: string): string {
  const token = accessToken.trim();
  if (isAppAutomationToken(token)) {
    throw new Error(
      "A raw App Automation Token (atkn_*) cannot be used as a Business Platform API bearer. " +
        "Set SHOPIFY_APP_AUTOMATION_TOKEN and let the server exchange it, or use SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN.",
    );
  }
  return token.match(/^shp(at|ua|ca|tka)/) ? token : `Bearer ${token}`;
}

export function businessPlatformAuthHeaders(
  accessToken: string,
): Record<string, string> {
  const auth = formatBusinessPlatformAuthValue(accessToken);
  return {
    "Content-Type": "application/json",
    Authorization: auth,
    "X-Shopify-Access-Token": auth,
  };
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

function readPartnerIdentityCredentials(): {
  refreshToken: string;
  accessToken: string;
} | null {
  const refreshToken =
    process.env.SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN?.trim() || null;
  const accessToken =
    process.env.SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN?.trim() || null;
  if (!refreshToken || !accessToken) return null;
  return { refreshToken, accessToken };
}

export function readPartnerOrganizationId(): string | null {
  return (
    process.env.SHOPIFY_PARTNER_ORG_ID?.trim() ||
    process.env.SHOPIFY_ORGANIZATION?.trim() ||
    null
  );
}

function getRawCredentialToken(): string | null {
  if (readPartnerIdentityCredentials()) return "identity";
  return readAutomationTokenFromEnv() ?? readDirectBusinessPlatformToken();
}

export function isPilotStoreAuthConfigured(): boolean {
  return Boolean(readPartnerOrganizationId() && getRawCredentialToken());
}

async function parseTokenResponse(
  res: Response,
  context: string,
): Promise<TokenResponse> {
  const text = await res.text();
  let payload: TokenResponse;
  try {
    payload = JSON.parse(text) as TokenResponse;
  } catch {
    throw new Error(
      `${context} failed (${res.status}): ${text.slice(0, 200) || "empty response"}`,
    );
  }
  return payload;
}

async function exchangeSubjectForBusinessPlatformToken(
  subjectToken: string,
  context: string,
): Promise<CachedToken> {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
    subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
    client_id: SHOPIFY_CLI_CLIENT_ID,
    audience: BUSINESS_PLATFORM_AUDIENCE,
    scope: BUSINESS_PLATFORM_SCOPES,
    subject_token: subjectToken,
  });

  const res = await fetch(IDENTITY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const payload = await parseTokenResponse(res, context);
  if (!res.ok || !payload.access_token) {
    const detail =
      payload.error_description ?? payload.error ?? "token exchange failed";
    throw new Error(`${context} (${res.status}): ${detail}`);
  }

  if (isAppAutomationToken(payload.access_token)) {
    throw new Error(
      `${context} returned another automation token instead of a Business Platform access token.`,
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

async function exchangeAutomationToken(
  automationToken: string,
): Promise<CachedToken> {
  try {
    return await exchangeSubjectForBusinessPlatformToken(
      automationToken,
      "App Automation Token exchange",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const invalidSubject = message.toLowerCase().includes("subject_token");
    const hint = invalidSubject
      ? "Create a new token in Dev Dashboard → Intastellar Consents → Settings → App automation token."
      : "App Automation Tokens are primarily for shopify app deploy; for store creation prefer SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN from `shopify auth login`.";
    throw new Error(`${message} ${hint}`);
  }
}

async function refreshPartnerIdentityToken(
  credentials: { refreshToken: string; accessToken: string },
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    client_id: SHOPIFY_CLI_CLIENT_ID,
  });

  const res = await fetch(IDENTITY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const payload = await parseTokenResponse(res, "Partner identity refresh");
  if (!res.ok || !payload.access_token) {
    const detail =
      payload.error_description ?? payload.error ?? "identity refresh failed";
    throw new Error(
      `Partner identity refresh (${res.status}): ${detail}. ` +
        "Run `npx shopify auth login` locally, then update SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN and SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN on Vercel.",
    );
  }
  return payload.access_token;
}

async function resolveFromPartnerIdentity(): Promise<CachedToken> {
  const credentials = readPartnerIdentityCredentials();
  if (!credentials) {
    throw new Error("Partner identity credentials are not configured.");
  }
  const identityAccess = await refreshPartnerIdentityToken(credentials);
  return exchangeSubjectForBusinessPlatformToken(
    identityAccess,
    "Partner identity → Business Platform exchange",
  );
}

/** Returns a valid Business Platform access token (cached until near expiry). */
export async function resolveBusinessPlatformAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > Date.now()) {
    return cachedAccessToken.accessToken;
  }

  const direct = readDirectBusinessPlatformToken();
  if (direct) return direct;

  const identity = readPartnerIdentityCredentials();
  if (identity) {
    cachedAccessToken = await resolveFromPartnerIdentity();
    return cachedAccessToken.accessToken;
  }

  const automation = readAutomationTokenFromEnv();
  if (automation) {
    cachedAccessToken = await exchangeAutomationToken(automation);
    return cachedAccessToken.accessToken;
  }

  throw new Error(
    "Pilot store provisioning is not configured. Set SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN + SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN (recommended), " +
      "SHOPIFY_APP_AUTOMATION_TOKEN, or a CLI session SHOPIFY_BUSINESS_PLATFORM_TOKEN, plus SHOPIFY_PARTNER_ORG_ID.",
  );
}
