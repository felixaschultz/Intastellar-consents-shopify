type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type ShopBrandAssets = {
  logo: string | null;
  color: string | null;
};

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

/**
 * Fetches the store's brand logo and primary color from Settings > Brand.
 * Uses the Storefront API (shop.brand) via an existing Storefront access token.
 */
export async function fetchShopBrandAssets(
  admin: AdminClient,
  myshopifyDomain: string,
): Promise<ShopBrandAssets> {
  const tokensRes = await admin.graphql(
    `#graphql
    query IntaStorefrontTokens {
      shop {
        storefrontAccessTokens(first: 5) {
          nodes {
            accessToken
          }
        }
      }
    }`,
  );
  const tokensJson = await tokensRes.json();
  const token = tokensJson.data?.shop?.storefrontAccessTokens?.nodes?.[0]
    ?.accessToken as string | undefined;
  if (!token) return { logo: null, color: null };

  const storefrontRes = await fetch(
    `https://${myshopifyDomain}/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: `#graphql
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
          }`,
      }),
    },
  );

  const storefrontJson = await storefrontRes.json();
  const brand = storefrontJson.data?.shop?.brand;
  if (!brand) return { logo: null, color: null };

  const logo = brand.logo?.url ?? brand.squareLogo?.url ?? null;
  const color = pickBrandColor(brand.colors?.primary, brand.colors?.secondary);

  return { logo, color };
}
