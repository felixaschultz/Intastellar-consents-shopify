import {
  SHOPIFY_APP_IDENTITY,
  SHOPIFY_APP_META,
  SHOPIFY_APP_URL,
  shopifyAppInstallUrl,
  shopifyAppSameAsLinks,
} from "./shopify-app-seo";

export const LANDING_URL = SHOPIFY_APP_URL;

export const LANDING_META = SHOPIFY_APP_META;

export const LANDING_FEATURES = [
  {
    title: "Same consent ID everywhere",
    body: "Shopify Customer Privacy API and Intastellar Consents share one consent identifier — no mismatches between storefront and analytics.",
  },
  {
    title: "Banner in minutes",
    body: "Theme app embed loads in compliance_head. Configure colors, copy, and cookie categories from the Shopify admin.",
  },
  {
    title: "Consent you can analyze",
    body: "See acceptance rates by region and behavior in the Intastellar Consents Platform — not just a legal log in Shopify admin.",
  },
  {
    title: "Built for compliance",
    body: "GDPR, CCPA, POPIA, LGPD, PDPA and DMA support with EU hosting, Google Consent Mode (including Advanced), and required-cookie disclosure.",
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "Is Intastellar Consents a Shopify app?",
    answer:
      "Yes. Intastellar Consents is an official Shopify app built by Intastellar Solutions, International. It includes a Shopify admin app for configuration and a theme app embed for your storefront cookie banner. Install it from consentsplatform.com or the Shopify App Store when listed.",
  },
  {
    question: "What is Intastellar Consents for Shopify?",
    answer:
      "Intastellar Consents is a Shopify app that shows a cookie consent banner on your storefront, stores banner settings on the app installation, and syncs consent data with Shopify’s Customer Privacy API while giving you analytics in Intastellar Consents.",
  },
  {
    question: "How do I install Intastellar Consents on my store?",
    answer:
      "Install the app from this page using your myshopify.com domain, approve permissions in Shopify admin, save your banner settings once, then enable the Intastellar Consents app embed in Online Store → Themes → Customize → App embeds.",
  },
  {
    question: "Does it work with Shopify Customer Privacy API?",
    answer:
      "Yes. The app is designed to align with Shopify’s Customer Privacy API and consent log, using a consistent consent ID so storefront choices match what you see in Intastellar Consents.",
  },
  {
    question: "Is Intastellar Consents GDPR compliant?",
    answer:
      "The app supports GDPR, CCPA, POPIA, LGPD, PDPA and DMA requirements including consent categories, policy links, required-cookie lists, and EU-hosted infrastructure. Merchants remain responsible for their overall compliance program.",
  },
  {
    question: "Is the cookie banner free for Shopify stores?",
    answer:
      "Yes. The consent banner is free to install and use on your Shopify storefront. Paid Intastellar Consents Platform plans add consent analytics, reporting, and multi-site management when you need deeper insight beyond Shopify’s built-in consent log.",
  },
  {
    question: "Will this break my Google Analytics or ad tracking?",
    answer:
      "No. After a visitor gives consent, your tags run as configured. If they decline, supported tools receive the correct paused signals via Google Consent Mode v2 — so measurement stays honest instead of silently misfiring.",
  },
  {
    question: "Does Intastellar Consents support Google Consent Mode?",
    answer:
      "Yes. The app supports Google Consent Mode v2, including Advanced mode, so Google tags respect visitor choices while keeping useful signals where Google allows — even when users decline non-essential cookies.",
  },
  {
    question: "Will the app slow down my Shopify store?",
    answer:
      "The banner loads as a lightweight theme app embed. It is designed to add minimal overhead compared to heavy enterprise CMPs — configuration lives in Shopify admin and the script loads from Intastellar Consents’ EU-hosted CDN.",
  },
  {
    question: "Can I customize the banner to match my store?",
    answer:
      "Yes. From the Shopify admin app you can adjust colors, layout, copy, cookie categories, policy links, and required cookies. The banner is meant to feel native to your theme, not like a generic third-party overlay.",
  },
] as const;

export function buildLandingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${LANDING_URL}#website`,
        name: `${SHOPIFY_APP_IDENTITY.name} — ${SHOPIFY_APP_IDENTITY.productType}`,
        alternateName: SHOPIFY_APP_IDENTITY.alternateNames,
        url: LANDING_URL,
        description: LANDING_META.description,
        inLanguage: "en-US",
        publisher: { "@id": "https://www.intastellarsolutions.com/#organization" },
      },
      {
        "@type": "WebPage",
        "@id": `${LANDING_URL}#webpage`,
        url: LANDING_URL,
        name: LANDING_META.title,
        description: LANDING_META.description,
        isPartOf: { "@id": `${LANDING_URL}#website` },
        about: { "@id": `${LANDING_URL}#shopify-app` },
        mainEntity: { "@id": `${LANDING_URL}#shopify-app` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${LANDING_URL}#shopify-app`,
        name: SHOPIFY_APP_IDENTITY.name,
        alternateName: SHOPIFY_APP_IDENTITY.alternateNames,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Shopify app — Cookie consent management",
        operatingSystem: "Shopify",
        installUrl: shopifyAppInstallUrl(),
        downloadUrl: LANDING_URL,
        softwareHelp: SHOPIFY_APP_IDENTITY.helpUrl,
        sameAs: shopifyAppSameAsLinks(),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free cookie consent banner for Shopify stores",
          url: LANDING_URL,
        },
        featureList: LANDING_FEATURES.map((f) => f.title),
        description: LANDING_META.description,
        url: LANDING_URL,
        author: { "@id": "https://www.intastellarsolutions.com/#organization" },
        provider: { "@id": "https://www.intastellarsolutions.com/#organization" },
        publisher: { "@id": "https://www.intastellarsolutions.com/#organization" },
      },
      {
        "@type": "FAQPage",
        "@id": `${LANDING_URL}#faq`,
        mainEntity: LANDING_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "Organization",
        "@id": "https://www.intastellarsolutions.com/#organization",
        name: "Intastellar Solutions, International",
        url: "https://www.intastellarsolutions.com/",
        sameAs: [
          "https://www.intastellarconsents.com",
          LANDING_URL,
        ],
        logo: {
          "@type": "ImageObject",
          url: "https://www.intastellarconsents.com/assets/icons/intastellar-logo-black.svg",
        },
      },
    ],
  };
}
