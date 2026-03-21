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

export type ShopBrandAssetsResult = ShopBrandAssets & {
  /** Non-fatal load issues (API errors, missing scopes, etc.) for debugging. */
  loadDiagnostics: string[];
};

function formatDiag(context: string, err: unknown): string {
  if (err instanceof Error) return `${context}: ${err.message}`;
  return `${context}: ${String(err)}`;
}

function graphqlErrorsMessage(json: { errors?: { message?: string }[] }): string | null {
  const errs = json.errors;
  if (!errs?.length) return null;
  return errs.map((e) => e.message ?? "unknown").join("; ");
}

const CHECKOUT_BRANDING_ACCESS_HINT =
  "checkout branding: Shopify returned access denied (Plus / dev store required by API). " +
  "If you are on a Partner development store: reinstall the app or approve updated scopes so the session includes read_checkout_branding_settings. " +
  "Only stores created as development stores in the Partner Dashboard qualify—not every trial shop.";

function formatCheckoutGraphQLError(
  operation: "profiles" | "branding",
  gqlMessage: string,
): string {
  const access =
    gqlMessage.includes("Access denied") && gqlMessage.includes("Plus plan");
  const checkoutRelated =
    /checkoutBranding|checkoutProfiles|checkout branding/i.test(gqlMessage);
  if (access && checkoutRelated) {
    return CHECKOUT_BRANDING_ACCESS_HINT;
  }
  return operation === "profiles"
    ? `checkoutProfiles: ${gqlMessage}`
    : `checkoutBranding: ${gqlMessage}`;
}

/** Theme file bodies can be text, base64, or a short-lived URL per Admin API. */
async function themeFileBodyToUtf8(
  body: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  if (!body || typeof body !== "object") return null;
  if (typeof body.content === "string") return body.content;
  if (typeof body.contentBase64 === "string") {
    try {
      return Buffer.from(body.contentBase64, "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  if (typeof body.url === "string") {
    const res = await fetch(body.url);
    if (!res.ok) return null;
    return res.text();
  }
  return null;
}

function normalizeThemeJsonText(raw: string): string {
  return raw.replace(/^\uFEFF/, "").trim();
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

type CheckoutProfilesData = {
  checkoutProfiles?: { nodes?: { id: string }[] };
};

/** Fetches brand logo and colors from checkout branding (Admin API). Plus/dev stores only. */
async function brandFromCheckout(admin: AdminClient): Promise<{
  assets: ShopBrandAssets;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];
  const empty = (): { assets: ShopBrandAssets; diagnostics: string[] } => ({
    assets: { logo: null, color: null },
    diagnostics,
  });

  try {
    const profilesRes = await admin.graphql(
      `#graphql
      query IntaCheckoutProfiles {
        checkoutProfiles(first: 1, query: "is_published:true") {
          nodes { id }
        }
      }`,
    );
    const profilesJson = (await profilesRes.json()) as {
      data?: CheckoutProfilesData;
      errors?: { message?: string }[];
    };
    const profilesGql = graphqlErrorsMessage(profilesJson);
    if (profilesGql) {
      diagnostics.push(formatCheckoutGraphQLError("profiles", profilesGql));
      return empty();
    }
    const profileId = profilesJson.data?.checkoutProfiles?.nodes?.[0]?.id;
    if (!profileId) {
      diagnostics.push(
        "checkout branding: no published checkout profile (or not available on this plan)",
      );
      return empty();
    }

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
    const brandingJson = (await brandingRes.json()) as {
      data?: { checkoutBranding?: Record<string, unknown> };
      errors?: { message?: string }[];
    };
    const brandingGql = graphqlErrorsMessage(brandingJson);
    if (brandingGql) {
      diagnostics.push(formatCheckoutGraphQLError("branding", brandingGql));
      return empty();
    }
    const data = brandingJson.data?.checkoutBranding;
    if (!data) {
      diagnostics.push("checkoutBranding: empty response");
      return empty();
    }

    const logoUrl =
      (data as { customizations?: { header?: { logo?: { image?: { url?: string } } } } })
        .customizations?.header?.logo?.image?.url ?? null;
    const color = pickCheckoutColor(
      (data as { designSystem?: { colors?: { global?: Record<string, unknown> } } })
        .designSystem?.colors?.global ?? {},
    );
    return { assets: { logo: logoUrl, color }, diagnostics };
  } catch (err) {
    diagnostics.push(formatDiag("checkout branding", err));
    return empty();
  }
}

/** Fetches brand color from main theme's settings_data.json (Admin API). */
async function colorFromThemeSettings(admin: AdminClient): Promise<{
  color: string | null;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];

  try {
    const themesRes = await admin.graphql(
      `#graphql
      query IntaMainTheme {
        themes(first: 1, roles: [MAIN]) {
          nodes { id }
        }
      }`,
    );
    const themesJson = (await themesRes.json()) as {
      data?: { themes?: { nodes?: { id: string }[] } };
      errors?: { message?: string }[];
    };
    const themesGql = graphqlErrorsMessage(themesJson);
    if (themesGql) {
      diagnostics.push(`themes: ${themesGql}`);
      return { color: null, diagnostics };
    }
    const themeId = themesJson.data?.themes?.nodes?.[0]?.id;
    if (!themeId) {
      diagnostics.push("theme: no MAIN theme found");
      return { color: null, diagnostics };
    }

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
                ... on OnlineStoreThemeFileBodyBase64 {
                  contentBase64
                }
                ... on OnlineStoreThemeFileBodyUrl {
                  url
                }
              }
            }
          }
        }
      }`,
      { variables: { themeId } },
    );
    const filesJson = (await filesRes.json()) as {
      data?: {
        theme?: {
          files?: {
            nodes?: { body?: Record<string, unknown> }[];
          };
        };
      };
      errors?: { message?: string }[];
    };
    const filesGql = graphqlErrorsMessage(filesJson);
    if (filesGql) {
      diagnostics.push(`theme files: ${filesGql}`);
      return { color: null, diagnostics };
    }
    const nodes = filesJson.data?.theme?.files?.nodes ?? [];
    const body = nodes[0]?.body;
    const rawContent = await themeFileBodyToUtf8(body);
    if (rawContent == null) {
      diagnostics.push(
        "theme: config/settings_data.json body missing or unsupported format (expected text, base64, or URL from Admin API)",
      );
      return { color: null, diagnostics };
    }

    const content = normalizeThemeJsonText(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      const hint =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      diagnostics.push(
        `theme: settings_data.json could not be parsed as JSON (${hint}). First 120 chars: ${content.slice(0, 120).replace(/\s+/g, " ")}`,
      );
      return { color: null, diagnostics };
    }

    const obj = parsed as Record<string, unknown>;
    const current = obj.current;
    const presets = obj.presets;

    let color: string | null = null;
    if (typeof current === "string" && presets && typeof presets === "object") {
      const preset = (presets as Record<string, unknown>)[current];
      if (preset) color = pickThemeColor(preset);
    }
    if (!color) color = pickThemeColor(obj);
    if (!color) {
      diagnostics.push(
        "theme: no hex colors found in settings_data.json (theme may use a different structure)",
      );
    }
    return { color, diagnostics };
  } catch (err) {
    diagnostics.push(formatDiag("theme settings", err));
    return { color: null, diagnostics };
  }
}

/**
 * Loads brand logo and color via Admin API:
 * 1. Checkout branding (Plus/dev) – logo + design system colors
 * 2. Theme settings – brand colors from main theme's config/settings_data.json
 */
export async function fetchShopBrandAssets(
  admin: AdminClient,
): Promise<ShopBrandAssetsResult> {
  const loadDiagnostics: string[] = [];
  let out: ShopBrandAssets = { logo: null, color: null };

  const checkout = await brandFromCheckout(admin);
  out = mergeAssets(out, checkout.assets);
  loadDiagnostics.push(...checkout.diagnostics);

  if (!out.color) {
    const theme = await colorFromThemeSettings(admin);
    if (theme.color) out = { ...out, color: theme.color };
    loadDiagnostics.push(...theme.diagnostics);
  }

  return { ...out, loadDiagnostics };
}
