/**
 * Canonical SEO / entity naming for the Intastellar Consents Shopify app.
 *
 * Two domains, one deployment:
 *   PUBLIC_SITE_URL     — consentsplatform.com (landing, SEO, legal, install entry)
 *   SHOPIFY_APP_URL     — app.consentsmanagement.com (Shopify OAuth / embedded app)
 */

function normalizeBase(url: string | undefined): string | null {
  const trimmed = url?.trim().replace(/\/$/, "");
  return trimmed || null;
}

/** Public marketing / install landing (consentsplatform.com). */
export function publicSiteBase(): string {
  return (
    normalizeBase(process.env.PUBLIC_SITE_URL) ?? "https://consentsplatform.com"
  );
}

/** Shopify app server URL for OAuth callbacks (app.consentsmanagement.com). */
export function shopifyAppServerBase(): string {
  return (
    normalizeBase(process.env.SHOPIFY_APP_URL) ?? "https://app.consentsmanagement.com"
  );
}

export const PUBLIC_SITE_URL = `${publicSiteBase()}/`;

/** @deprecated Prefer PUBLIC_SITE_URL for SEO/landing; server URL is shopifyAppServerBase(). */
export const SHOPIFY_APP_URL = PUBLIC_SITE_URL;

export const SHOPIFY_APP_IDENTITY = {
  name: "Intastellar Consents",
  productType: "Shopify app",
  fullTitle: "Intastellar Consents | Official Shopify App for Cookie Consent",
  shortTitle: "Intastellar Consents — Shopify App",
  legacyTitle: "Intastellar Consents: Consent management for your Shopify store",
  description:
    "Intastellar Consents is the official Shopify app by Intastellar Solutions for GDPR-ready cookie consent banners, Shopify Customer Privacy API sync, and consent analytics.",
  alternateNames: [
    "Intastellar Consents Shopify App",
    "Intastellar Consents for Shopify",
    "Intastellar Consents: Consent management for your Shopify store",
    "Intastellar Consents cookie consent Shopify app",
  ],
  developer: "Intastellar Solutions International",
  installPath: "/auth/login",
  helpUrl: "https://inta.dev",
  marketingUrl:
    "https://www.intastellarsolutions.com/solutions/cookie-consents",
  shopifyIntegrationUrl:
    "https://www.intastellarsolutions.com/solutions/cookie-consents/integrations/shopify",
  platformUrl: "https://www.intastellarconsents.com",
  publicSiteHost: "consentsplatform.com",
  appServerHost: "app.consentsmanagement.com",
} as const;

export function shopifyAppSameAsLinks(): string[] {
  const links = [
    PUBLIC_SITE_URL,
    SHOPIFY_APP_IDENTITY.shopifyIntegrationUrl,
    SHOPIFY_APP_IDENTITY.marketingUrl,
    SHOPIFY_APP_IDENTITY.platformUrl,
  ];
  const appStore = process.env.SHOPIFY_APP_STORE_LISTING_URL?.trim();
  if (appStore) links.unshift(appStore);
  const serverBase = shopifyAppServerBase();
  if (serverBase !== publicSiteBase()) {
    links.push(`${serverBase}/`);
  }
  return links;
}

/** Merchant-facing install URL on the public site. */
export function shopifyAppInstallUrl(): string {
  return `${publicSiteBase()}${SHOPIFY_APP_IDENTITY.installPath}`;
}

export const SHOPIFY_APP_META = {
  title: SHOPIFY_APP_IDENTITY.fullTitle,
  description: SHOPIFY_APP_IDENTITY.description,
};
