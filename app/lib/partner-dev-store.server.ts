/**
 * Creates app development stores via Shopify Business Platform Organizations API
 * (same backend as `shopify store create dev`).
 *
 * Env (Vercel / production):
 * - SHOPIFY_PARTNER_IDENTITY_REFRESH_TOKEN + SHOPIFY_PARTNER_IDENTITY_ACCESS_TOKEN (recommended)
 * - SHOPIFY_APP_AUTOMATION_TOKEN — from Dev Dashboard → App → Settings (fallback)
 * - SHOPIFY_PARTNER_ORG_ID — numeric org id from partners.shopify.com URL
 *
 * Env (local dev alternative):
 * - SHOPIFY_BUSINESS_PLATFORM_TOKEN — CLI session access token (not atkn_*)
 */

import {
  businessPlatformAuthHeaders,
  clearBusinessPlatformTokenCache,
  isPilotStoreAuthConfigured,
  readPartnerOrganizationId,
  resolveBusinessPlatformAccessToken,
} from "./shopify-business-platform-auth.server";

const BP_FQDN = "destinations.shopifysvc.com";

export type StoreCreationStatus =
  | "CALLING_CORE"
  | "AWAITING_CORE_STORE_READY"
  | "FINALIZING"
  | "COMPLETE"
  | "FAILED"
  | "TIMED_OUT"
  | "USER_ERROR"
  | "UNKNOWN";

type BpUserError = { code?: string; field?: string[]; message?: string };

export function isPilotStoreProvisioningConfigured(): boolean {
  return isPilotStoreAuthConfigured();
}

async function organizationsGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const organizationId = readPartnerOrganizationId();
  if (!organizationId) {
    throw new Error(
      "SHOPIFY_PARTNER_ORG_ID is not set (numeric id from partners.shopify.com/ORG_ID/...).",
    );
  }

  const accessToken = await resolveBusinessPlatformAccessToken();
  const url = `https://${BP_FQDN}/organizations/api/unstable/organization/${organizationId}/graphql`;

  const doRequest = async (token: string) =>
    fetch(url, {
      method: "POST",
      headers: businessPlatformAuthHeaders(token),
      body: JSON.stringify({ query, variables }),
    });

  let res = await doRequest(accessToken);

  if (res.status === 401 || res.status === 403) {
    clearBusinessPlatformTokenCache();
    const retryToken = await resolveBusinessPlatformAccessToken({
      skipDirect: true,
    });
    if (retryToken !== accessToken) {
      res = await doRequest(retryToken);
    }
  }

  const text = await res.text();
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `Business Platform API unauthorized (${res.status}). ` +
        "Tokens may be expired or mismatched in .env. Run `shopify auth logout`, `shopify auth login`, " +
        "`npm run export:pilot-env`, and copy all four SHOPIFY_* pilot variables together.",
    );
  }

  let json: { data?: T; errors?: { message?: string }[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      `Business Platform API returned non-JSON (${res.status}): ${text.slice(0, 200) || "(empty)"}`,
    );
  }

  if (!res.ok || json.errors?.length) {
    const graphqlMsg = json.errors?.map((e) => e.message).join("; ");
    const msg =
      graphqlMsg ||
      text.slice(0, 300) ||
      `HTTP ${res.status}`;
    if (res.status === 400) {
      throw new Error(
        `Business Platform API bad request (400): ${msg}. ` +
          "Check SHOPIFY_PARTNER_ORG_ID (numeric id from partners.shopify.com) and refresh partner identity tokens.",
      );
    }
    throw new Error(`Business Platform API error (${res.status}): ${msg}`);
  }
  if (!json.data) throw new Error("Business Platform API returned empty data");
  return json.data;
}

export async function createAppDevelopmentStore(
  shopName: string,
): Promise<{ shopDomain: string; shopAdminUrl: string | null }> {
  const data = await organizationsGraphql<{
    createAppDevelopmentStore?: {
      shopDomain?: string | null;
      shopAdminUrl?: string | null;
      userErrors?: BpUserError[];
    };
  }>(
    `mutation CreateAppDevelopmentStore($shopName: String!, $priceLookupKey: String!, $prepopulateTestData: Boolean) {
      createAppDevelopmentStore(
        shopName: $shopName
        priceLookupKey: $priceLookupKey
        prepopulateTestData: $prepopulateTestData
      ) {
        shopAdminUrl
        shopDomain
        userErrors { code field message }
      }
    }`,
    {
      shopName,
      priceLookupKey:
        process.env.SHOPIFY_PILOT_STORE_PLAN_KEY?.trim() ||
        "SHOPIFY_PLUS_APP_DEVELOPMENT",
      prepopulateTestData: false,
    },
  );

  const result = data.createAppDevelopmentStore;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((e) => e.message ?? "unknown error").join(", "),
    );
  }
  const shopDomain = result?.shopDomain?.trim();
  if (!shopDomain) {
    throw new Error("Store creation returned no shop domain");
  }
  return {
    shopDomain,
    shopAdminUrl: result?.shopAdminUrl ?? null,
  };
}

export async function pollStoreCreationStatus(
  shopDomain: string,
): Promise<StoreCreationStatus> {
  const data = await organizationsGraphql<{
    organization?: {
      storeCreation?: { status?: StoreCreationStatus | null } | null;
    } | null;
  }>(
    `query PollStoreCreation($shopDomain: String!) {
      organization {
        storeCreation(shopDomain: $shopDomain) { status }
      }
    }`,
    { shopDomain },
  );

  return data.organization?.storeCreation?.status ?? "UNKNOWN";
}

export function normalizeShopDomain(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  return `${trimmed}.myshopify.com`;
}
