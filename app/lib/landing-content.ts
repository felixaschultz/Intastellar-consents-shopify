const LANDING_BASE =
  process.env.SHOPIFY_APP_URL?.replace(/\/$/, "") ||
  "https://app.consentsmanagement.com";

export const LANDING_URL = `${LANDING_BASE}/`;

export const LANDING_META = {
  title: "Intastellar Consents — Cookie consent for Shopify stores",
  description:
    "Shopify app for GDPR-ready cookie consent banners, Shopify Customer Privacy API sync, and consent analytics with the same consent ID across Shopify and Intastellar.",
};

export const LANDING_FEATURES = [
  {
    title: "Same consent ID everywhere",
    body: "Shopify Customer Privacy API and Intastellar share one consent identifier — no mismatches between storefront and analytics.",
  },
  {
    title: "Banner in minutes",
    body: "Theme app embed loads in compliance_head. Configure colors, copy, and cookie categories from the Shopify admin.",
  },
  {
    title: "Consent you can analyze",
    body: "See acceptance rates by region and behavior in the Intastellar dashboard — not just a legal log in Shopify admin.",
  },
  {
    title: "Built for compliance",
    body: "GDPR, CCPA, and DMA support with EU hosting, Google Consent Mode (including Advanced), and required-cookie disclosure.",
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "What is Intastellar Consents for Shopify?",
    answer:
      "Intastellar Consents is a Shopify app that shows a cookie consent banner on your storefront, stores banner settings on the app installation, and syncs consent data with Shopify’s Customer Privacy API while giving you analytics in Intastellar.",
  },
  {
    question: "How do I install Intastellar Consents on my store?",
    answer:
      "Install the app from this page using your myshopify.com domain, approve permissions in Shopify admin, save your banner settings once, then enable the Intastellar Consents app embed in Online Store → Themes → Customize → App embeds.",
  },
  {
    question: "Does it work with Shopify Customer Privacy API?",
    answer:
      "Yes. The app is designed to align with Shopify’s Customer Privacy API and consent log, using a consistent consent ID so storefront choices match what you see in Intastellar.",
  },
  {
    question: "Is Intastellar Consents GDPR compliant?",
    answer:
      "The app supports GDPR, CCPA, and DMA requirements including consent categories, policy links, required-cookie lists, and EU-hosted infrastructure. Merchants remain responsible for their overall compliance program.",
  },
] as const;

export function buildLandingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${LANDING_URL}#website`,
        name: "Intastellar Consents",
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
        about: { "@id": `${LANDING_URL}#software` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${LANDING_URL}#software`,
        name: "Intastellar Consents",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Cookie consent management",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Install via Shopify App Store or direct install link",
        },
        featureList: LANDING_FEATURES.map((f) => f.title),
        description: LANDING_META.description,
        url: LANDING_URL,
        provider: { "@id": "https://www.intastellarsolutions.com/#organization" },
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
        name: "Intastellar Solutions International",
        url: "https://www.intastellarsolutions.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://www.intastellarconsents.com/assets/icons/intastellar-logo-black.svg",
        },
      },
    ],
  };
}
