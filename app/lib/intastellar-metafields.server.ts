type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

/** App-installation metafield (app-owned); exposed in theme app extensions as `app.metafields`. */
export const INTA_METAFIELD_NAMESPACE = "intastellar_consents";
export const INTA_METAFIELD_KEY = "banner_config";

export type IntaSettings = {
  rootDomain: string;
  company: string;
  arrange: "ltr" | "rtl";
  color: string;
  logo: string;
  design: string;
  gtagId: string;
  requiredCookies: string[];
  keepInLocalStorage: string[];
};

export type IntaConfig = {
  policy_link: string;
  settings: IntaSettings;
};

export function defaultIntaConfig(shop: {
  name: string;
  primaryDomainHost: string;
}): IntaConfig {
  const host = shop.primaryDomainHost || "example.com";
  return {
    policy_link: `https://${host}/policies/privacy-policy`,
    settings: {
      rootDomain: host,
      company: shop.name,
      arrange: "ltr",
      color: "#1a1a1a",
      logo: "",
      design: "overlay",
      gtagId: "",
      requiredCookies: [],
      keepInLocalStorage: [],
    },
  };
}

export function parseIntaConfigFromMetafieldValue(
  raw: string | null | undefined,
  shop: { name: string; primaryDomainHost: string },
): IntaConfig {
  if (!raw) return defaultIntaConfig(shop);
  try {
    const parsed = JSON.parse(raw) as IntaConfig;
    if (!parsed || typeof parsed !== "object") return defaultIntaConfig(shop);
    const base = defaultIntaConfig(shop);
    return {
      policy_link:
        typeof parsed.policy_link === "string"
          ? parsed.policy_link
          : base.policy_link,
      settings: {
        ...base.settings,
        ...(parsed.settings && typeof parsed.settings === "object"
          ? parsed.settings
          : {}),
        arrange:
          parsed.settings?.arrange === "rtl" ? "rtl" : ("ltr" as const),
        requiredCookies: Array.isArray(parsed.settings?.requiredCookies)
          ? parsed.settings!.requiredCookies!.filter(
              (x): x is string => typeof x === "string",
            )
          : base.settings.requiredCookies,
        keepInLocalStorage: Array.isArray(parsed.settings?.keepInLocalStorage)
          ? parsed.settings!.keepInLocalStorage!.filter(
              (x): x is string => typeof x === "string",
            )
          : base.settings.keepInLocalStorage,
      },
    };
  } catch {
    return defaultIntaConfig(shop);
  }
}

export async function loadAppInstallationIntaConfig(
  admin: AdminClient,
  shop: { name: string; primaryDomainHost: string },
): Promise<IntaConfig> {
  const res = await admin.graphql(
    `#graphql
    query IntaAppInstallationMetafield($namespace: String!, $key: String!) {
      currentAppInstallation {
        metafield(namespace: $namespace, key: $key) {
          value
        }
      }
    }`,
    {
      variables: {
        namespace: INTA_METAFIELD_NAMESPACE,
        key: INTA_METAFIELD_KEY,
      },
    },
  );
  const json = await res.json();
  const raw = json.data?.currentAppInstallation?.metafield?.value as
    | string
    | undefined;
  return parseIntaConfigFromMetafieldValue(raw, shop);
}

export async function saveAppInstallationIntaConfig(
  admin: AdminClient,
  appInstallationId: string,
  config: IntaConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await admin.graphql(
    `#graphql
    mutation IntaMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: appInstallationId,
            namespace: INTA_METAFIELD_NAMESPACE,
            key: INTA_METAFIELD_KEY,
            type: "json",
            value: JSON.stringify(config),
          },
        ],
      },
    },
  );
  const json = await res.json();
  const userErrors = json.data?.metafieldsSet?.userErrors ?? [];
  if (userErrors.length) {
    return {
      ok: false,
      message: userErrors.map((e: { message: string }) => e.message).join("; "),
    };
  }
  return { ok: true };
}
