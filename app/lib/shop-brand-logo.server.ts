import type { ApiVersion } from "@shopify/shopify-app-remix/server";

type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

/** Matches `ApiVersion.January25` in shopify.server.ts */
const STOREFRONT_API_VERSION = "2025-01";

export type ShopBrandAssets = {
  logo: string | null;
  color: string | null;
};

type StorefrontLike = {
  graphql: (
    query: string,
    options?: { apiVersion?: ApiVersion; variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const SHOP_BRAND_QUERY = `#graphql
  query ShopBrandAssets {
    shop {
      brand {
        logo { url }
        squareLogo { url }
        colors {
          primary { background foreground }
          secondary { background foreground }
        }
      }
    }
  }
`;

/** Picks the first valid CSS color from brand color groups (primary, then secondary). */
function pickBrandColor(primary: unknown, secondary: unknown): string | null {
  const take = (group: unknown): string | null => {
    if (!group || typeof group !== "object") return null;
    const g = group as Record<string, unknown>;
    const bg = g.background;
    const fg = g.foreground;
    if (typeof bg === "string" && bg.trim()) return bg;
    if (typeof fg === "string" && fg.trim()) return fg;
    return null;
  };
  for (const arr of [primary, secondary] as Array<unknown>) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const first = arr[0];
    const c = take(first);
    if (c) return c;
  }
  return null;
}

function parseBrandFromStorefrontJson(json: unknown): ShopBrandAssets {
  const data = json as {
    data?: { shop?: { brand?: Record<string, unknown> } };
    errors?: unknown[];
  };
  if (data.errors?.length) return { logo: null, color: null };
  const brand = data.data?.shop?.brand;
  if (!brand) return { logo: null, color: null };
  const logoObj = brand.logo as { url?: string } | undefined;
  const square = brand.squareLogo as { url?: string } | undefined;
  const colors = brand.colors as
    | { primary?: unknown; secondary?: unknown }
    | undefined;
  const logo = logoObj?.url ?? square?.url ?? null;
  const color = pickBrandColor(colors?.primary, colors?.secondary);
  return { logo, color };
}

function mergeAssets(
  a: ShopBrandAssets,
  b: ShopBrandAssets,
): ShopBrandAssets {
  return {
    logo: a.logo ?? b.logo,
    color: a.color ?? b.color,
  };
}

async function brandFromStorefrontFetch(
  myshopifyDomain: string,
  accessToken: string,
): Promise<ShopBrandAssets> {
  const storefrontRes = await fetch(
    `https://${myshopifyDomain}/api/${STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: SHOP_BRAND_QUERY }),
    },
  );
  const storefrontJson = await storefrontRes.json();
  return parseBrandFromStorefrontJson(storefrontJson);
}

async function getFirstListedStorefrontToken(
  admin: AdminClient,
): Promise<string | null> {
  const tokensRes = await admin.graphql(
    `#graphql
    query IntaStorefrontTokens {
      shop {
        storefrontAccessTokens(first: 10) {
          nodes { accessToken }
        }
      }
    }`,
  );
  const tokensJson = await tokensRes.json();
  return tokensJson.data?.shop?.storefrontAccessTokens?.nodes?.[0]
    ?.accessToken as string | undefined ?? null;
}

async function createStorefrontAccessToken(admin: AdminClient): Promise<string | null> {
  const res = await admin.graphql(
    `#graphql
    mutation IntaCreateStorefrontToken($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        userErrors { field message }
        storefrontAccessToken { accessToken }
      }
    }`,
    {
      variables: {
        input: { title: "Intastellar Consents (brand preview)" },
      },
    },
  );
  const json = await res.json();
  const errs = json.data?.storefrontAccessTokenCreate?.userErrors ?? [];
  if (errs.length) return null;
  return json.data?.storefrontAccessTokenCreate?.storefrontAccessToken
    ?.accessToken as string | undefined ?? null;
}

/**
 * Loads brand logo + color via Storefront API `shop.brand`.
 * Tries, in order: Remix `unauthenticated.storefront` (session token), listed tokens, new token.
 */
export async function fetchShopBrandAssets(
  admin: AdminClient,
  myshopifyDomain: string,
  options: {
    storefront?: StorefrontLike;
    storefrontApiVersion?: ApiVersion;
  } = {},
): Promise<ShopBrandAssets> {
  let out: ShopBrandAssets = { logo: null, color: null };

  if (options.storefront) {
    try {
      const response = await options.storefront.graphql(SHOP_BRAND_QUERY, {
        apiVersion: options.storefrontApiVersion,
      });
      const json = await response.json();
      out = mergeAssets(out, parseBrandFromStorefrontJson(json));
    } catch {
      /* session may not support Storefront */
    }
  }

  const needMore = !out.logo || !out.color;
  if (needMore) {
    let token = await getFirstListedStorefrontToken(admin);
    if (!token) token = await createStorefrontAccessToken(admin);
    if (token) {
      try {
        out = mergeAssets(out, await brandFromStorefrontFetch(myshopifyDomain, token));
      } catch {
        /* ignore */
      }
    }
  }

  return out;
}
