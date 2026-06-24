/**
 * Canonical SEO / entity naming for the Intastellar Consents Shopify app.
 * Use these strings consistently in titles, JSON-LD, and on-page copy so search
 * engines and AI assistants can match "Intastellar Consents" → Shopify app.
 */

const APP_BASE =
  process.env.SHOPIFY_APP_URL?.replace(/\/$/, "") ||
  "https://app.consentsmanagement.com";

export const SHOPIFY_APP_URL = `${APP_BASE}/`;

export const SHOPIFY_APP_IDENTITY = {
  /** Primary product name */
  name: "Intastellar Consents",
  /** Explicit product type — repeat in titles and schema */
  productType: "Shopify app",
  fullTitle: "Intastellar Consents | Official Shopify App for Cookie Consent",
  shortTitle: "Intastellar Consents — Shopify App",
  /** Legacy title still indexed elsewhere; keep as alternateName in schema */
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
  helpUrl:
    "https://developers.intastellarsolutions.com/cookie-solutions/docs",
  marketingUrl:
    "https://www.intastellarsolutions.com/solutions/cookie-consents",
  shopifyIntegrationUrl:
    "https://www.intastellarsolutions.com/solutions/cookie-consents/integrations/shopify",
  platformUrl: "https://www.intastellarconsents.com",
} as const;

/** Public URLs that identify this product (App Store URL via env when listed). */
export function shopifyAppSameAsLinks(): string[] {
  const links = [
    SHOPIFY_APP_URL,
    SHOPIFY_APP_IDENTITY.shopifyIntegrationUrl,
    SHOPIFY_APP_IDENTITY.marketingUrl,
    SHOPIFY_APP_IDENTITY.platformUrl,
  ];
  const appStore = process.env.SHOPIFY_APP_STORE_LISTING_URL?.trim();
  if (appStore) links.unshift(appStore);
  return links;
}

export function shopifyAppInstallUrl(): string {
  return `${APP_BASE}${SHOPIFY_APP_IDENTITY.installPath}`;
}

export const SHOPIFY_APP_META = {
  title: SHOPIFY_APP_IDENTITY.fullTitle,
  description: SHOPIFY_APP_IDENTITY.description,
};
