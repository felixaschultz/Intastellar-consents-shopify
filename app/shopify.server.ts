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

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: scopesFromEnv.length > 0 ? scopesFromEnv : undefined,
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
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
    const shopQ = url.searchParams.get("shop");
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
        headers: request.headers,
      }),
    );
  }

  return innerLogin(request);
}

export default shopify;
export { ApiVersion };
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = loginWithResolvedShopDomain;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
