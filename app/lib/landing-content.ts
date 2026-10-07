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
    title: "Live in 2 minutes, no code",
    body: "Turn on the app embed in your theme editor. No Liquid edits, works with every Online Store 2.0 theme.",
  },
  {
    title: "Keeps Google & Meta ads measuring",
    body: "Google Consent Mode v2 (Basic & Advanced) and Meta Pixel fire correctly the moment a visitor says yes.",
  },
  {
    title: "One consent ID everywhere",
    body: "Shopify's Customer Privacy API and Intastellar share one consent identifier, so storefront, checkout and analytics agree.",
  },
  {
    title: "Right banner for every market",
    body: "Region-aware rules follow your Shopify Markets: opt-in in the EU, opt-out in California, in the visitor's language.",
  },
  {
    title: "Consent you can analyze",
    body: "See acceptance by country, device and day, not just a legal log in the Shopify admin. Export reports any time.",
  },
  {
    title: "EU-hosted, no dark patterns",
    body: "Data stays in the EU. Equal Accept and Reject buttons, automatic cookie scanning and required-cookie disclosure.",
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "Does it work with Shopify's Customer Privacy API?",
    answer:
      "Yes. Consent is written to the Customer Privacy API with the same consent ID Intastellar uses, so Shopify, your pixels and your analytics stay in sync.",
  },
  {
    question: "Do I need to edit my theme code?",
    answer: "No. The banner loads through a theme app embed you switch on in the theme editor.",
  },
  {
    question: "How is the Shopify app related to the Intastellar Consents Platform?",
    answer:
      "The app puts the banner on your storefront. Analytics and reporting live in the Intastellar Consents Platform, which you sign in to with the same account.",
  },
  {
    question: "Where is consent data stored?",
    answer: "On EU servers, operated by Intastellar Solutions, International in Denmark.",
  },
  {
    question: "Is it in the Shopify App Store?",
    answer:
      "The App Store listing is in review. Until then you can install directly from this page.",
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
        publisher: { "@id": "https://www.intastellar.eu/#organization" },
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
        author: { "@id": "https://www.intastellar.eu/#organization" },
        provider: { "@id": "https://www.intastellar.eu/#organization" },
        publisher: { "@id": "https://www.intastellar.eu/#organization" },
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
        "@id": "https://www.intastellar.eu/#organization",
        name: "Intastellar Solutions, International",
        url: "https://www.intastellar.eu/",
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
