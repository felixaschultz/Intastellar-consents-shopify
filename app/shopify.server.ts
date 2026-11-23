import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { resolveShopInputToMyshopifyHost } from "./resolve-shop-domain.server";

const scopesFromEnv = (process.env.SCOPES ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** New FormData must not reuse the old multipart boundary from Content-Type. */
function headersForRebuiltFormData(request: Request): Headers {
  const h = new Headers(request.headers);
  h.delete("content-type");
  h.delete("content-length");
  return h;
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January26,
  scopes: scopesFromEnv.length > 0 ? scopesFromEnv : undefined,
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  // `db.prisma.io` scales to zero on idle; a cold wake-up can take longer
  // than the library's 10s default retry budget (2 x 5s), which makes
  // PrismaSessionStorage misreport a transient connection timeout as a
  // "missing session table" error. Give it more room to survive that.
  sessionStorage: new PrismaSessionStorage(prisma, {
    connectionRetries: 5,
    connectionRetryIntervalMs: 4000,
  }),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

async function loginWithResolvedShopDomain(request: Request) {
  const url = new URL(request.url);
  const innerLogin = shopify.login.bind(shopify);

  if (request.method === "GET") {
    const shopQ = url.searchParams.get("shop")?.trim();
    if (shopQ) {
      const resolved = await resolveShopInputToMyshopifyHost(shopQ);
      if (resolved) {
        url.searchParams.set("shop", resolved);
        return innerLogin(
          new Request(url.toString(), { method: "GET", headers: request.headers }),
        );
      }
    }
    return innerLogin(request);
  }

  if (request.method === "POST") {
    const fd = await request.formData();
    const shopField = fd.get("shop");
    const shopStr = typeof shopField === "string" ? shopField.trim() : "";
    let shopForLogin = shopStr;
    if (shopStr) {
      const resolved = await resolveShopInputToMyshopifyHost(shopStr);
      if (resolved) shopForLogin = resolved;
    }
    const newFd = new FormData();
    for (const [k, v] of fd.entries()) {
      if (k === "shop") continue;
      newFd.append(k, v);
    }
    if (shopStr) newFd.set("shop", shopForLogin);
    return innerLogin(
      new Request(request.url, {
        method: "POST",
        body: newFd,
        headers: headersForRebuiltFormData(request),
      }),
    );
  }

  return innerLogin(request);
}

/**
 * shopify-api's sanitizeHost() only checks that `host` looks like base64,
 * then calls `new URL()` on the decoded value. A base64 string that decodes
 * to garbage (App Store review fuzzes this) throws "Invalid URL" and turns
 * into a 500. Reject those as a 400 before the library sees them.
 */
function rejectUndecodableHost(request: Request) {
  const host = new URL(request.url).searchParams.get("host");
  if (!host || !/^[0-9a-zA-Z+/]+={0,2}$/.test(host)) return;
  try {
    new URL(`https://${Buffer.from(host, "base64").toString("utf-8")}`);
  } catch {
    throw new Response("Invalid host parameter", { status: 400 });
  }
}

const authenticateAdmin: typeof shopify.authenticate.admin = async (request) => {
  rejectUndecodableHost(request);
  return shopify.authenticate.admin(request);
};

export default shopify;
export { ApiVersion };
export const apiVersion = ApiVersion.January26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = { ...shopify.authenticate, admin: authenticateAdmin };
export const unauthenticated = shopify.unauthenticated;
export const login = loginWithResolvedShopDomain;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
