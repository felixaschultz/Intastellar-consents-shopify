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

const THEME_LOGO_SETTING_KEYS = [
  "logo",
  "checkout_logo_image",
  "brand_image",
  "header_logo",
  "mobile_logo",
] as const;

function readLogoFromSettingsBlock(settings: unknown): string | null {
  if (!settings || typeof settings !== "object") return null;
  const s = settings as Record<string, unknown>;
  for (const key of THEME_LOGO_SETTING_KEYS) {
    const value = s[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Finds a logo reference in theme settings_data.json (URL or shopify://shop_images/…). */
function pickThemeLogoRef(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  const current = record.current;

  // Online Store 2.0: logo lives in current.sections.*.settings (e.g. Dawn header).
  if (current && typeof current === "object" && !Array.isArray(current)) {
    const cur = current as Record<string, unknown>;
    const fromGlobal = readLogoFromSettingsBlock(cur);
    if (fromGlobal) return fromGlobal;

    const sections = cur.sections;
    if (sections && typeof sections === "object" && !Array.isArray(sections)) {
      for (const section of Object.values(sections as Record<string, unknown>)) {
        if (!section || typeof section !== "object") continue;
        const fromSection = readLogoFromSettingsBlock(
          (section as Record<string, unknown>).settings,
        );
        if (fromSection) return fromSection;
      }
    }
  }

  // Legacy themes: logo on the active preset object.
  if (typeof current === "string" && record.presets && typeof record.presets === "object") {
    const preset = (record.presets as Record<string, unknown>)[current];
    const fromPreset = readLogoFromSettingsBlock(preset);
    if (fromPreset) return fromPreset;
  }

  for (const [key, value] of Object.entries(record)) {
    if (
      THEME_LOGO_SETTING_KEYS.includes(
        key as (typeof THEME_LOGO_SETTING_KEYS)[number],
      ) &&
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = pickThemeLogoRef(value);
      if (nested) return nested;
    }
  }
  return null;
}

async function queryFilesForImageUrl(
  admin: AdminClient,
  query: string,
): Promise<{ url: string | null; error: string | null }> {
  const res = await admin.graphql(
    `#graphql
    query IntaShopImageFile($query: String!) {
      files(first: 5, query: $query) {
        nodes {
          ... on MediaImage {
            image {
              url
            }
          }
          ... on GenericFile {
            url
          }
        }
      }
    }`,
    { variables: { query } },
  );
  const json = (await res.json()) as {
    data?: {
      files?: {
        nodes?: Array<{
          image?: { url?: string };
          url?: string;
        }>;
      };
    };
    errors?: { message?: string }[];
  };
  const gqlError = graphqlErrorsMessage(json);
  if (gqlError) return { url: null, error: gqlError };

  for (const node of json.data?.files?.nodes ?? []) {
    const url = node?.image?.url ?? node?.url ?? null;
    if (url) return { url, error: null };
  }
  return { url: null, error: null };
}

async function resolveThemeLogoReference(
  admin: AdminClient,
  ref: string,
  diagnostics: string[],
): Promise<string | null> {
  if (/^https?:\/\//i.test(ref)) return ref;

  const shopImage = ref.match(/^shopify:\/\/shop_images\/(.+)$/i);
  if (!shopImage) {
    diagnostics.push(`theme: unsupported logo reference format (${ref})`);
    return null;
  }

  const filename = shopImage[1];
  const queries = [`filename:${filename}`, filename];
  for (const query of queries) {
    const { url, error } = await queryFilesForImageUrl(admin, query);
    if (url) return url;
    if (error) {
      diagnostics.push(`theme files API: ${error}`);
      if (/access denied|not authorized|scope/i.test(error)) {
        diagnostics.push(
          "theme: approve the read_files permission for this app (reinstall or accept updated scopes), then try Use store logo again",
        );
      }
      return null;
    }
  }

  diagnostics.push(
    `theme: logo file "${filename}" was found in theme settings but could not be resolved to a CDN URL`,
  );
  return null;
}

/** Shop brand logo from Admin API (when available on the shop record). */
async function brandFromShop(admin: AdminClient): Promise<{
  assets: ShopBrandAssets;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];
  const empty = (): { assets: ShopBrandAssets; diagnostics: string[] } => ({
    assets: { logo: null, color: null },
    diagnostics,
  });

  try {
    const res = await admin.graphql(
      `#graphql
      query IntaShopBrandLogo {
        shop {
          brand {
            logo {
              image {
                url
              }
            }
          }
        }
      }`,
    );
    const json = (await res.json()) as {
      data?: { shop?: { brand?: { logo?: { image?: { url?: string } } } } };
      errors?: { message?: string }[];
    };
    const gqlError = graphqlErrorsMessage(json);
    if (gqlError) {
      diagnostics.push(`shop.brand: ${gqlError}`);
      return empty();
    }
    const logoUrl = json.data?.shop?.brand?.logo?.image?.url ?? null;
    if (!logoUrl) diagnostics.push("shop.brand: no logo on shop record");
    return { assets: { logo: logoUrl, color: null }, diagnostics };
  } catch (err) {
    diagnostics.push(formatDiag("shop.brand", err));
    return empty();
  }
}

async function loadMainThemeSettingsJson(
  admin: AdminClient,
): Promise<{ parsed: Record<string, unknown> | null; diagnostics: string[] }> {
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
      return { parsed: null, diagnostics };
    }
    const themeId = themesJson.data?.themes?.nodes?.[0]?.id;
    if (!themeId) {
      diagnostics.push("theme: no MAIN theme found");
      return { parsed: null, diagnostics };
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
      return { parsed: null, diagnostics };
    }
    const nodes = filesJson.data?.theme?.files?.nodes ?? [];
    const body = nodes[0]?.body;
    const rawContent = await themeFileBodyToUtf8(body);
    if (rawContent == null) {
      diagnostics.push(
        "theme: config/settings_data.json body missing or unsupported format (expected text, base64, or URL from Admin API)",
      );
      return { parsed: null, diagnostics };
    }

    const content = normalizeThemeJsonText(rawContent);
    try {
      return { parsed: JSON.parse(content) as Record<string, unknown>, diagnostics };
    } catch (parseErr) {
      const hint =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      diagnostics.push(
        `theme: settings_data.json could not be parsed as JSON (${hint}). First 120 chars: ${content.slice(0, 120).replace(/\s+/g, " ")}`,
      );
      return { parsed: null, diagnostics };
    }
  } catch (err) {
    diagnostics.push(formatDiag("theme settings", err));
    return { parsed: null, diagnostics };
  }
}

/** Logo + color from main theme settings_data.json (read_themes). */
async function brandFromThemeSettings(admin: AdminClient): Promise<{
  assets: ShopBrandAssets;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];
  const empty = (): { assets: ShopBrandAssets; diagnostics: string[] } => ({
    assets: { logo: null, color: null },
    diagnostics,
  });

  const { parsed, diagnostics: loadDiag } =
    await loadMainThemeSettingsJson(admin);
  diagnostics.push(...loadDiag);
  if (!parsed) return empty();

  let color: string | null = null;
  const current = parsed.current;
  const presets = parsed.presets;
  if (typeof current === "string" && presets && typeof presets === "object") {
    const preset = (presets as Record<string, unknown>)[current];
    if (preset) color = pickThemeColor(preset);
  }
  if (!color) color = pickThemeColor(parsed);
  if (!color) {
    diagnostics.push(
      "theme: no hex colors found in settings_data.json (theme may use a different structure)",
    );
  }

  let logo: string | null = null;
  const logoRef = pickThemeLogoRef(parsed);
  if (logoRef) {
    logo = await resolveThemeLogoReference(admin, logoRef, diagnostics);
    if (!logo) {
      diagnostics.push(
        `theme: logo reference found (${logoRef}) but URL resolution failed`,
      );
    }
  } else {
    diagnostics.push(
      "theme: no logo in settings_data.json — set one under Online Store → Themes → Customize → Header",
    );
  }

  return { assets: { logo, color }, diagnostics };
}

/**
 * Loads brand logo and color via Admin API:
 * 1. Shop brand record (when exposed on Admin API)
 * 2. Checkout branding (Plus/dev) – logo + design system colors
 * 3. Theme settings – logo + colors from main theme's config/settings_data.json
 */
export async function fetchShopBrandAssets(
  admin: AdminClient,
): Promise<ShopBrandAssetsResult> {
  const loadDiagnostics: string[] = [];
  let out: ShopBrandAssets = { logo: null, color: null };

  const shopBrand = await brandFromShop(admin);
  out = mergeAssets(out, shopBrand.assets);
  loadDiagnostics.push(...shopBrand.diagnostics);

  const checkout = await brandFromCheckout(admin);
  out = mergeAssets(out, checkout.assets);
  loadDiagnostics.push(...checkout.diagnostics);

  const theme = await brandFromThemeSettings(admin);
  out = mergeAssets(out, theme.assets);
  loadDiagnostics.push(...theme.diagnostics);

  return { ...out, loadDiagnostics };
}
