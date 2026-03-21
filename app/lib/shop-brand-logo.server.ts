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

function mergeAssets(
  a: ShopBrandAssets,
  b: ShopBrandAssets,
): ShopBrandAssets {
  return {
    logo: a.logo ?? b.logo,
    color: a.color ?? b.color,
  };
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

/** Picks best brand color from checkout design system (brand > accent > decorative). */
function pickCheckoutColor(global: {
  brand?: string | null;
  accent?: string | null;
  decorative?: string | null;
}): string | null {
  if (typeof global.brand === "string" && HEX_COLOR.test(global.brand))
    return global.brand;
  if (typeof global.accent === "string" && HEX_COLOR.test(global.accent))
    return global.accent;
  if (typeof global.decorative === "string" && HEX_COLOR.test(global.decorative))
    return global.decorative;
  return null;
}

/** Recursively finds hex colors in theme settings, preferring button/accent/brand. */
function pickThemeColor(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const pairs: { key: string; value: string }[] = [];

  function collect(o: unknown, prefix = ""): void {
    if (!o || typeof o !== "object") return;
    const record = o as Record<string, unknown>;
    for (const [k, v] of Object.entries(record)) {
      if (typeof v === "string" && HEX_COLOR.test(v)) {
        pairs.push({ key: prefix + k, value: v });
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        collect(v, prefix + k + ".");
      }
    }
  }
  collect(obj);

  const prefer = (sub: string) =>
    pairs.find((p) => p.key.toLowerCase().includes(sub))?.value ?? null;
  return (
    prefer("button") ??
    prefer("accent") ??
    prefer("brand") ??
    prefer("primary") ??
    pairs[0]?.value ??
    null
  );
}

/** Fetches brand logo and colors from checkout branding (Admin API). Plus/dev stores only. */
async function brandFromCheckout(admin: AdminClient): Promise<ShopBrandAssets> {
  const profilesRes = await admin.graphql(
    `#graphql
    query IntaCheckoutProfiles {
      checkoutProfiles(first: 1, query: "is_published:true") {
        nodes { id }
      }
    }`,
  );
  const profilesJson = await profilesRes.json();
  const profileId = profilesJson.data?.checkoutProfiles?.nodes?.[0]?.id as
    | string
    | undefined;
  if (!profileId) return { logo: null, color: null };

  const brandingRes = await admin.graphql(
    `#graphql
    query IntaCheckoutBranding($profileId: ID!) {
      checkoutBranding(checkoutProfileId: $profileId) {
        customizations {
          header {
            logo {
              image { url }
            }
          }
        }
        designSystem {
          colors {
            global {
              brand
              accent
              decorative
            }
          }
        }
      }
    }`,
    { variables: { profileId } },
  );
  const brandingJson = await brandingRes.json();
  const data = brandingJson.data?.checkoutBranding;
  if (!data) return { logo: null, color: null };

  const logoUrl =
    data.customizations?.header?.logo?.image?.url ?? null;
  const color = pickCheckoutColor(data.designSystem?.colors?.global ?? {});
  return { logo: logoUrl, color };
}

/** Fetches brand color from main theme's settings_data.json (Admin API). */
async function colorFromThemeSettings(admin: AdminClient): Promise<string | null> {
  const themesRes = await admin.graphql(
    `#graphql
    query IntaMainTheme {
      themes(first: 1, roles: [MAIN]) {
        nodes { id }
      }
    }`,
  );
  const themesJson = await themesRes.json();
  const themeId = themesJson.data?.themes?.nodes?.[0]?.id as string | undefined;
  if (!themeId) return null;

  const filesRes = await admin.graphql(
    `#graphql
    query IntaThemeSettings($themeId: ID!) {
      theme(id: $themeId) {
        files(filenames: ["config/settings_data.json"], first: 1) {
          nodes {
            body {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }
      }
    }`,
    { variables: { themeId } },
  );
  const filesJson = await filesRes.json();
  const nodes = filesJson.data?.theme?.files?.nodes ?? [];
  const content = nodes[0]?.body?.content;
  if (typeof content !== "string") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  const current = obj.current;
  const presets = obj.presets;

  if (typeof current === "string" && presets && typeof presets === "object") {
    const preset = (presets as Record<string, unknown>)[current];
    if (preset) return pickThemeColor(preset);
  }
  return pickThemeColor(obj);
}

/**
 * Loads brand logo and color via Admin API:
 * 1. Checkout branding (Plus/dev) – logo + design system colors
 * 2. Theme settings – brand colors from main theme's config/settings_data.json
 */
export async function fetchShopBrandAssets(
  admin: AdminClient,
): Promise<ShopBrandAssets> {
  let out: ShopBrandAssets = { logo: null, color: null };

  try {
    const checkout = await brandFromCheckout(admin);
    out = mergeAssets(out, checkout);
  } catch {
    /* Checkout branding requires Plus plan; non-Plus stores will fail */
  }

  if (!out.color) {
    try {
      const themeColor = await colorFromThemeSettings(admin);
      if (themeColor) out = { ...out, color: themeColor };
    } catch {
      /* read_themes scope may be missing or theme inaccessible */
    }
  }

  return out;
}
