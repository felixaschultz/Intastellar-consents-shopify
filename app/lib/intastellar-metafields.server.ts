type AdminClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

/** App-installation metafield (app-owned); exposed in theme app extensions as `app.metafields`. */
export const INTA_METAFIELD_NAMESPACE = "intastellar_consents";
export const INTA_METAFIELD_KEY = "banner_config";
export const INTA_ONBOARDING_METAFIELD_KEY = "onboarding";

export type OnboardingState = {
  completed: boolean;
  completedAt?: string;
};

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

export function parseOnboardingState(
  raw: string | null | undefined,
): OnboardingState {
  if (!raw) return { completed: false };
  try {
    const o = JSON.parse(raw) as OnboardingState;
    return {
      completed: Boolean(o.completed),
      completedAt:
        typeof o.completedAt === "string" ? o.completedAt : undefined,
    };
  } catch {
    return { completed: false };
  }
}

/** Single round-trip: banner config, onboarding flag, installation id (for home / loader). */
export async function loadAppInstallationHomeData(
  admin: AdminClient,
  shop: { name: string; primaryDomainHost: string },
): Promise<{
  config: IntaConfig;
  onboarding: OnboardingState;
  installationId: string;
}> {
  const res = await admin.graphql(
    `#graphql
    query IntaAppInstallationHome {
      currentAppInstallation {
        id
        bannerConfig: metafield(
          namespace: "${INTA_METAFIELD_NAMESPACE}",
          key: "${INTA_METAFIELD_KEY}"
        ) {
          value
        }
        onboardingState: metafield(
          namespace: "${INTA_METAFIELD_NAMESPACE}",
          key: "${INTA_ONBOARDING_METAFIELD_KEY}"
        ) {
          value
        }
      }
    }`,
  );
  const json = await res.json();
  const inst = json.data?.currentAppInstallation;
  const installationId = inst?.id as string | undefined;
  if (!installationId) {
    throw new Response("App installation unavailable", { status: 500 });
  }
  const bannerRaw = inst?.bannerConfig?.value as string | undefined;
  const onboardingRaw = inst?.onboardingState?.value as string | undefined;
  return {
    config: parseIntaConfigFromMetafieldValue(bannerRaw, shop),
    onboarding: parseOnboardingState(onboardingRaw),
    installationId,
  };
}

export async function loadAppInstallationIntaConfig(
  admin: AdminClient,
  shop: { name: string; primaryDomainHost: string },
): Promise<IntaConfig> {
  const { config } = await loadAppInstallationHomeData(admin, shop);
  return config;
}

export async function saveOnboardingState(
  admin: AdminClient,
  appInstallationId: string,
  state: OnboardingState,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const payload: OnboardingState = {
    ...state,
    ...(state.completed
      ? { completedAt: state.completedAt ?? new Date().toISOString() }
      : {}),
  };
  const res = await admin.graphql(
    `#graphql
    mutation IntaOnboardingMetafieldSet($metafields: [MetafieldsSetInput!]!) {
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
            key: INTA_ONBOARDING_METAFIELD_KEY,
            type: "json",
            value: JSON.stringify(payload),
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
