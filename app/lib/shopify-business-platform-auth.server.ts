/**
 * Resolves a Business Platform API access token for pilot dev-store creation.
 *
 * Production (Vercel) — recommended:
 * - SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN + SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN
 *   from `shopify auth login` CLI session identity (atkn_* format is normal in CLI 3.94+)
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

/** Clear cached token (e.g. after Business Platform API 401). */
export function clearBusinessPlatformTokenCache(): void {
  cachedAccessToken = null;
}

export function isAppAutomationToken(token: string): boolean {
  return token.trim().startsWith("atkn_");
}

/** CLI sends Business Platform tokens as `Bearer <token>` unless already shpat/shpua/etc. */
export function formatBusinessPlatformAuthValue(accessToken: string): string {
  const token = accessToken.trim();
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
  return direct || null;
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
  if (readDirectBusinessPlatformToken()) return "business-platform";
  if (readPartnerIdentityCredentials()) return "identity";
  return readAutomationTokenFromEnv();
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
        "Run `npx shopify auth login` (browser device code), re-extract identity tokens from the CLI session, " +
        "and update SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN + SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN on Vercel. " +
        "Note: newer Shopify CLI stores identity tokens as atkn_* after browser login — that is expected.",
    );
  }
  return payload.access_token;
}

async function resolveFromPartnerIdentity(): Promise<CachedToken> {
  const credentials = readPartnerIdentityCredentials();
  if (!credentials) {
    throw new Error("Partner identity credentials are not configured.");
  }

  try {
    return await exchangeSubjectForBusinessPlatformToken(
      credentials.accessToken,
      "Partner identity → Business Platform exchange",
    );
  } catch (exchangeErr) {
    try {
      const refreshed = await refreshPartnerIdentityToken(credentials);
      return await exchangeSubjectForBusinessPlatformToken(
        refreshed,
        "Partner identity → Business Platform exchange",
      );
    } catch (refreshErr) {
      const exchangeMsg =
        exchangeErr instanceof Error ? exchangeErr.message : String(exchangeErr);
      const refreshMsg =
        refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
      throw new Error(
        "Could not obtain a Business Platform token from partner identity credentials. " +
          `Exchange failed (${exchangeMsg}). Refresh failed (${refreshMsg}). ` +
          "Run `shopify auth logout`, then `shopify auth login`, then `npm run export:pilot-env`, " +
          "and copy all four SHOPIFY_* pilot variables into .env together (do not mix old and new tokens).",
      );
    }
  }
}

function cacheDirectToken(token: string): CachedToken {
  return {
    accessToken: token,
    expiresAtMs: Date.now() + 50 * 60 * 1000,
  };
}

/** Returns a valid Business Platform access token (cached until near expiry). */
export async function resolveBusinessPlatformAccessToken(options?: {
  /** When true, skip SHOPIFY_BUSINESS_PLATFORM_TOKEN and use identity refresh/exchange. */
  skipDirect?: boolean;
}): Promise<string> {
  if (
    !options?.skipDirect &&
    cachedAccessToken &&
    cachedAccessToken.expiresAtMs > Date.now()
  ) {
    return cachedAccessToken.accessToken;
  }

  const direct = options?.skipDirect ? null : readDirectBusinessPlatformToken();
  if (direct) {
    cachedAccessToken = cacheDirectToken(direct);
    return direct;
  }

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
    "Pilot store provisioning is not configured. Set SHOPIFY_BUSINESS_PLATFORM_TOKEN (from `npm run export:pilot-env`), " +
      "SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN + SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN, " +
      "SHOPIFY_APP_AUTOMATION_TOKEN, plus SHOPIFY_PARTNER_ORG_ID.",
  );
}
