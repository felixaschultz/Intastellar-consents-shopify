/**
 * Prints Vercel-ready env lines for demo-store provisioning.
 *
 * Prerequisites (fresh tokens — CLI sessions expire in ~1 hour):
 *   1. shopify auth logout          ← required if tokens are expired
 *   2. shopify auth login           ← browser device flow; pick your Partner account
 *   3. npm run export:pilot-env
 *
 * Note: `shopify auth login` alone only *selects* an existing session; it does not
 * refresh expired tokens. Use logout first when export shows EXPIRED.
 *
 * Copy the output into Vercel → Settings → Environment Variables (Production).
 * Never commit the printed values to git.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const APP_CONFIG_PATH = path.join(
  os.homedir(),
  "Library/Preferences/shopify-cli-app-nodejs/config.json",
);
const KIT_CONFIG_PATH = path.join(
  os.homedir(),
  "Library/Preferences/shopify-cli-kit-nodejs/config.json",
);
/** Business Platform API audience — same as shopify-business-platform-auth.server.ts */
const BUSINESS_PLATFORM_AUDIENCE = "32ff8ee5-82b8-4d93-9f8a-c6997cefb7dc";

type IdentitySession = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
};

type CliSession = {
  identity?: IdentitySession & { expiresAt?: string };
  applications?: Record<string, { accessToken?: string; refreshToken?: string; expiresAt?: string }>;
};

type AccountsSessionStore = Record<string, Record<string, CliSession>>;

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOrgId(projectDir: string): string | null {
  const cfg = readJson(APP_CONFIG_PATH) as Record<string, { orgId?: string }> | null;
  if (!cfg) return null;
  const entry = cfg[projectDir];
  if (entry?.orgId) return String(entry.orgId);
  const first = Object.values(cfg).find((v) => v?.orgId);
  return first?.orgId ? String(first.orgId) : null;
}

function parseSession(raw: unknown): CliSession | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as CliSession;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as CliSession;
      return typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** CLI stores session data as a JSON object or a JSON string (macOS conf format). */
function reconstructSessionStoreBlob(
  store: unknown,
): AccountsSessionStore | null {
  if (!store) return null;

  if (typeof store === "string") {
    try {
      return JSON.parse(store) as AccountsSessionStore;
    } catch {
      return null;
    }
  }

  if (typeof store !== "object") return null;

  const record = store as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return null;

  const allNumeric = keys.every((k) => /^\d+$/.test(k));
  if (allNumeric) {
    const joined = keys
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => String(record[k] ?? ""))
      .join("");
    try {
      return JSON.parse(joined) as AccountsSessionStore;
    } catch {
      return null;
    }
  }

  if (record["accounts.shopify.com"]) {
    return record as AccountsSessionStore;
  }

  return null;
}

function identityFromAccountsStore(
  accounts: AccountsSessionStore | null,
  sessionId: string | undefined,
): { accessToken: string; refreshToken: string } | null {
  if (!accounts) return null;

  const hosts = ["accounts.shopify.com", "partners.shopify.com"];
  const sessionIds = sessionId
    ? [sessionId, ...Object.keys(accounts).flatMap((h) => Object.keys(accounts[h] ?? {}))]
    : Object.keys(accounts).flatMap((h) => Object.keys(accounts[h] ?? {}));

  const seen = new Set<string>();
  for (const host of [...hosts, ...Object.keys(accounts)]) {
    const bySession = accounts[host];
    if (!bySession) continue;
    for (const sid of sessionIds) {
      if (seen.has(sid)) continue;
      seen.add(sid);
      const access = bySession[sid]?.identity?.accessToken?.trim();
      const refresh = bySession[sid]?.identity?.refreshToken?.trim();
      if (access && refresh) return { accessToken: access, refreshToken: refresh };
    }
  }

  return null;
}

function findBusinessPlatformToken(): string | null {
  const kit = readJson(KIT_CONFIG_PATH) as {
    currentSessionId?: string;
    currentDevSessionId?: string;
    sessionStore?: unknown;
    devSessionStore?: unknown;
  } | null;

  if (!kit) return null;
  const sessionId = kit.currentSessionId ?? kit.currentDevSessionId;

  for (const store of [kit.sessionStore, kit.devSessionStore]) {
    const accounts = reconstructSessionStoreBlob(store);
    if (!accounts || !sessionId) continue;

    for (const host of Object.keys(accounts)) {
      const session = accounts[host]?.[sessionId];
      const token =
        session?.applications?.[BUSINESS_PLATFORM_AUDIENCE]?.accessToken?.trim();
      if (token) return token;
    }
  }

  return null;
}

function findIdentityTokens(): {
  accessToken: string;
  refreshToken: string;
} | null {
  const kit = readJson(KIT_CONFIG_PATH) as {
    currentSessionId?: string;
    currentDevSessionId?: string;
    sessionStore?: Record<string, unknown>;
    devSessionStore?: Record<string, unknown>;
  } | null;

  if (!kit) return null;

  const sessionId = kit.currentSessionId ?? kit.currentDevSessionId;

  for (const store of [kit.sessionStore, kit.devSessionStore]) {
    const accounts = reconstructSessionStoreBlob(store);
    const fromAccounts = identityFromAccountsStore(accounts, sessionId);
    if (fromAccounts) return fromAccounts;
  }

  const stores = [kit.sessionStore, kit.devSessionStore].filter(Boolean) as Record<
    string,
    unknown
  >[];

  const candidates: unknown[] = [];
  for (const store of stores) {
    if (sessionId && store[sessionId]) candidates.push(store[sessionId]);
    candidates.push(...Object.values(store));
  }

  for (const raw of candidates) {
    const session = parseSession(raw);
    const access = session?.identity?.accessToken?.trim();
    const refresh = session?.identity?.refreshToken?.trim();
    if (access && refresh) return { accessToken: access, refreshToken: refresh };
  }

  return null;
}

function main() {
  const projectDir = process.cwd();
  const orgId = readOrgId(projectDir);
  const businessPlatformToken = findBusinessPlatformToken();
  const tokens = findIdentityTokens();

  console.log("# Demo-store env for Vercel (Production)\n");

  if (orgId) {
    console.log(`SHOPIFY_PARTNER_ORG_ID=${orgId}`);
  } else {
    console.log("# SHOPIFY_PARTNER_ORG_ID=???");
    console.log(
      "# Could not read org id. Open partners.shopify.com — the number in the URL is your org id.",
    );
  }

  if (businessPlatformToken) {
    console.log(`SHOPIFY_BUSINESS_PLATFORM_TOKEN=${businessPlatformToken}`);
  }

  if (tokens) {
    console.log(`SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN=${tokens.accessToken}`);
    console.log(`SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN=${tokens.refreshToken}`);
    if (
      businessPlatformToken &&
      tokens.accessToken &&
      businessPlatformToken !== tokens.accessToken
    ) {
      console.log(
        "# WARNING: identity access token differs from business platform token — unusual; re-export after login.",
      );
    }
  }

  if (businessPlatformToken || tokens) {
    const kit = readJson(KIT_CONFIG_PATH) as {
      currentSessionId?: string;
      sessionStore?: unknown;
    } | null;
    const accounts = reconstructSessionStoreBlob(kit?.sessionStore);
    const sid = kit?.currentSessionId;
    const session =
      sid && accounts?.["accounts.shopify.com"]?.[sid];
    const expiresAt =
      session?.applications?.[BUSINESS_PLATFORM_AUDIENCE]?.accessToken
        ? session?.applications?.[BUSINESS_PLATFORM_AUDIENCE]?.expiresAt
        : session?.identity?.expiresAt;
    if (expiresAt) {
      const expired = Date.parse(expiresAt) < Date.now();
      console.log(`# Token expires: ${expiresAt}${expired ? " (EXPIRED)" : ""}`);
      if (expired) {
        console.log("#");
        console.log("# Your CLI session is stale. `shopify auth login` only picks an");
        console.log("# existing session — it does NOT refresh tokens. Run:");
        console.log("#   shopify auth logout");
        console.log("#   shopify auth login");
        console.log("#   npm run export:pilot-env");
        process.exitCode = 1;
      }
    }
    console.log(
      "\n# Recommended for Vercel: all four variables below (identity pair enables auto-refresh on server).",
    );
    console.log("# Redeploy after saving, then test the demo form.");
    return;
  }

  console.log("# SHOPIFY_BUSINESS_PLATFORM_TOKEN=???");
  console.log("# SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN=???");
  console.log("# SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN=???");
  console.log("\n# No CLI session tokens found yet.");
  console.log("#   shopify auth logout   # skip if never logged in");
  console.log("#   shopify auth login    # complete browser login");
  console.log("#   npm run export:pilot-env");
  process.exitCode = 1;
}

main();
