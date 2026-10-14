import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { resolveShopInputToMyshopifyHost } from "./resolve-shop-domain.server";
// Plans for the Intastellar Consents Platform (intastellarconsents.com) — the
// paid CMP dashboard add-on. The Shopify app itself stays free (merchants can
// use Shopify's own consent log at no charge); a subscription here is what
// unlocks the hosted platform. Per Shopify's app review requirement 1.2.1,
// any charge tied to the app must go through Shopify's Billing API rather
// than a checkout on our own site.
import { BILLING_PLANS, BILLING_PLAN_PRICES } from "./lib/billing-plans";

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
  billing: {
    [BILLING_PLANS.PERSONAL]: {
      lineItems: [
        {
          amount: BILLING_PLAN_PRICES[BILLING_PLANS.PERSONAL],
          currencyCode: "EUR",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    [BILLING_PLANS.STARTER]: {
      lineItems: [
        {
          amount: BILLING_PLAN_PRICES[BILLING_PLANS.STARTER],
          currencyCode: "EUR",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    [BILLING_PLANS.GROWTH]: {
      lineItems: [
        {
          amount: BILLING_PLAN_PRICES[BILLING_PLANS.GROWTH],
          currencyCode: "EUR",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
    [BILLING_PLANS.AGENCY_PRO]: {
      lineItems: [
        {
          amount: BILLING_PLAN_PRICES[BILLING_PLANS.AGENCY_PRO],
          currencyCode: "EUR",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// Demo/development stores can't be charged for real, so requests made
// outside of production must go through Shopify's test-charge path.
export function isTestBillingMode() {
  return process.env.NODE_ENV !== "production";
}

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

export default shopify;
export { ApiVersion };
export const apiVersion = ApiVersion.January26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = loginWithResolvedShopDomain;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
