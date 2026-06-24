/**
 * Creates app development stores via Shopify Business Platform Organizations API
 * (same backend as `shopify store create dev`).
 *
 * Requires env:
 * - SHOPIFY_BUSINESS_PLATFORM_TOKEN — Business Platform token from a Partner org owner session
 * - SHOPIFY_PARTNER_ORG_ID — numeric organization id from partners.shopify.com URL
 */

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

function partnerOrgConfig(): { token: string; organizationId: string } | null {
  const token = process.env.SHOPIFY_BUSINESS_PLATFORM_TOKEN?.trim();
  const organizationId = process.env.SHOPIFY_PARTNER_ORG_ID?.trim();
  if (!token || !organizationId) return null;
  return { token, organizationId };
}

export function isPilotStoreProvisioningConfigured(): boolean {
  return partnerOrgConfig() !== null;
}

async function organizationsGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = partnerOrgConfig();
  if (!config) {
    throw new Error(
      "Pilot store provisioning is not configured (SHOPIFY_BUSINESS_PLATFORM_TOKEN, SHOPIFY_PARTNER_ORG_ID)",
    );
  }

  const url = `https://${BP_FQDN}/organizations/api/unstable/organization/${config.organizationId}/graphql`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let json: { data?: T; errors?: { message?: string }[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      `Business Platform API returned non-JSON (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok || json.errors?.length) {
    const msg =
      json.errors?.map((e) => e.message).join("; ") ||
      `HTTP ${res.status}`;
    throw new Error(`Business Platform API error: ${msg}`);
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
