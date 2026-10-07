import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { AppProvider, BlockStack, Image, Text } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";
import logo from "../../assets/combined-intastellar-shopify.svg";
import appScreen from "../../assets/app-screen.png";
import IntastellarShopifyGuideVideo from "../../assets/vid/Intastellar Consents - Shopify Install Guide.mp4";
import {
  buildLandingJsonLd,
  LANDING_FAQ,
  LANDING_FEATURES,
  LANDING_META,
  LANDING_URL,
} from "../../lib/landing-content";
import { APP_LEGAL_LINKS } from "../../lib/legal-content";
import { SHOPIFY_APP_IDENTITY, INTASTELLAR_SUPPORT_LINKS } from "../../lib/shopify-app-seo";
/** JSON-LD for this landing route; root reads `handle.jsonLdSchema` into `<head>`. */
const jsonLdSchema = buildLandingJsonLd();

/** Marketing-site banner config — scoped to `/` only via root `handle` (never on embedded `/app`). */
const landingIntaConfig = {
  policy_link: {
    url: "https://www.intastellarsolutions.com/about/legal/privacy",
    target: "_blank",
  },
  settings: {
    rootDomain: process.env.VITE_INTA_LANDING_ROOT_DOMAIN || "consentsplatform.com",
    company: "Intastellar Solutions, International",
    color: "rgb(163, 133, 64)",
    language: "auto",
    gtagId: "G-86T4LDB766",
    arrange: "rtl",
    design: "nova",
    requiredCookies: [],
    keepInLocalStorage: [],
    logo: "https://consentsplatform.com/assets/combined-intastellar-shopify-9l5Y1w6a.svg",
  },
};

/**
 * Read in root via useMatches() to inject GTM, JSON-LD, and Intastellar banner only on this route.
 * Set `VITE_GTM_CONTAINER_ID=GTM-XXXX` in `.env`.
 */
export const handle = {
  googleTagManagerId: process.env.VITE_GTM_CONTAINER_ID || "",
  jsonLdSchema,
  intaConfig: landingIntaConfig,
  headScripts: [
    {
      src: "https://consents.cdn.intastellarsolutions.com/uc.js",
      async: true,
    },
    {
      src: "https://analytics.consentsmanagement.com/api/a",
      async: true,
      defer: true,
      attributes: {
        site: "lXZGCLTHEjB6_QwT"
      }
    }
  ],
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  if (url.searchParams.get("install") === "direct") {
    throw redirect("/auth/login");
  }

  return {
    showForm: Boolean(login),
    polarisTranslations,
  };
};

export const meta = () => {
  const ogImage = appScreen.startsWith("http")
    ? appScreen
    : new URL(appScreen, LANDING_URL).href;

  return [
    { title: LANDING_META.title },
    { name: "description", content: LANDING_META.description },
    { name: "application-name", content: `${SHOPIFY_APP_IDENTITY.name} Shopify App` },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: LANDING_URL },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: "Intastellar Consents Shopify app admin preview" },
    { property: "og:title", content: LANDING_META.title },
    { property: "og:description", content: LANDING_META.description },
    { property: "og:url", content: LANDING_URL },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Intastellar Consents" },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: LANDING_META.title },
    { name: "twitter:description", content: LANDING_META.description },
    { name: "twitter:image", content: ogImage },
  ];
};

// Replace favicon with the logo

export const links = () => {
  /* 
  Use these links to replace the favicon:
  <link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="apple-touch-icon" sizes="57x57" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-57x57.png">
      <link rel="apple-touch-icon" sizes="60x60" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-60x60.png">
      <link rel="apple-touch-icon" sizes="72x72" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-72x72.png">
      <link rel="apple-touch-icon" sizes="76x76" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-76x76.png">
      <link rel="apple-touch-icon" sizes="114x114" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-114x114.png">
      <link rel="apple-touch-icon" sizes="120x120" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-120x120.png">
      <link rel="apple-touch-icon" sizes="144x144" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-144x144.png">
      <link rel="apple-touch-icon" sizes="152x152" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-152x152.png">
      <link rel="apple-touch-icon" sizes="180x180" href="https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-180x180.png">
      <link rel="icon" type="image/png" sizes="192x192" href="https://www.intastellarsolutions.com/assets/icons/fav/android-icon-192x192.png">
      <link rel="icon" type="image/png" sizes="32x32" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="96x96" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-96x96.png">
      <link rel="icon" type="image/png" sizes="16x16" href="https://www.intastellarsolutions.com/assets/icons/fav/favicon-16x16.png">
  */
  return [
    { rel: "stylesheet", href: polarisStyles },
    { rel: "apple-touch-icon", sizes: "57x57", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-57x57.png" },
    { rel: "apple-touch-icon", sizes: "60x60", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-60x60.png" },
    { rel: "apple-touch-icon", sizes: "72x72", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-72x72.png" },
    { rel: "apple-touch-icon", sizes: "76x76", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-76x76.png" },
    { rel: "apple-touch-icon", sizes: "114x114", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-114x114.png" },
    { rel: "apple-touch-icon", sizes: "120x120", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-120x120.png" },
    { rel: "apple-touch-icon", sizes: "144x144", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-144x144.png" },
    { rel: "apple-touch-icon", sizes: "152x152", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-152x152.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "https://www.intastellarsolutions.com/assets/icons/fav/apple-icon-180x180.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", href: "https://www.intastellarsolutions.com/assets/icons/fav/android-icon-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-96x96.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "https://www.intastellarsolutions.com/assets/icons/fav/favicon-16x16.png" },
  ]
};

export default function App() {
  const {
    showForm,
    polarisTranslations,
  } = useLoaderData<typeof loader>();

  return (
    <AppProvider i18n={polarisTranslations}>
      <div className={styles.page}>
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>
        <header className={styles.siteHeader}>
          <div className={styles.siteHeaderInner}>
            <div className={styles.logoWrap}>
              <Link
                className={styles.logoLink}
                to="https://www.intastellarsolutions.com/solutions/cookie-consents"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  source={logo}
                  alt="Intastellar Consents for Shopify"
                  className={styles.logoImage}
                />
              </Link>
              <span className={styles.comingSoon}>Now available via demo store · Shopify App Store listing in progress</span>
            </div>
            <div className={styles.headerActions}>
              <Link to="/auth/login" className={styles.headerLoginBtn}>
                Log in
              </Link>
            </div>
          </div>
        </header>
        <main id="main-content" className={styles.index}>
          <section className={styles.hero} aria-labelledby="hero-heading">
            <ul className={styles.heroBadges} aria-label="Highlights">
              <li className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                EU-hosted
              </li>
              <li className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                Shopify Customer Privacy API
              </li>
              <li className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                Free to install
              </li>
            </ul>
            <h1 id="hero-heading" className={styles.heading}>
              Understand Shopify consent data.{" "}
              <span className={styles.headingAccent}>Not just store it.</span>
            </h1>
            <p className={styles.lead}>
              Cookie consent for Shopify with the same consent ID across Shopify
              Customer Privacy API and Intastellar Consents - plus analytics merchants
              actually use.
            </p>
            <p className={styles.identityBlurb}>
              <strong>{SHOPIFY_APP_IDENTITY.name}</strong> is the official{" "}
              <strong>{SHOPIFY_APP_IDENTITY.productType}</strong> from{" "}
              {SHOPIFY_APP_IDENTITY.developer}. Install here to add the consent
              banner to your Shopify storefront; use{" "}
              <Link
                to={SHOPIFY_APP_IDENTITY.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Intastellar Consents Platform
              </Link>{" "}
              separately for analytics and reporting.
            </p>
          </section>
          <div className={styles.content}>
          <section className={styles.formSection}>
            {showForm && (
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <div className={styles.formIntro}>
                    <p className={styles.formCardTitle}>Install the app</p>
                    <Text as="p" variant="bodyMd">
                      Enter your Shopify store domain to install Intastellar
                      Consents and open it in your Shopify admin.
                    </Text>
                  </div>
                </BlockStack>

                <Form className={styles.form} method="post" action="/auth/login">
                  <label className={styles.label}>
                    <span className={styles.labelTitle}>Shop domain</span>
                    <input
                      className={styles.input}
                      type="text"
                      name="shop"
                      autoComplete="url"
                      placeholder="your-store.myshopify.com"
                      required
                    />
                    <span className={styles.helpText}>
                      Use your .myshopify.com address or a custom domain
                      connected to your store.
                    </span>
                  </label>
                  <button className={styles.button} type="submit">
                    Continue with Shopify
                  </button>
                  <p className={styles.formLegal}>
                    By continuing, you agree to the{" "}
                    <Link to={APP_LEGAL_LINKS.terms}>App Terms of Use</Link> and{" "}
                    <Link to={APP_LEGAL_LINKS.privacy}>App Privacy Policy</Link>.
                  </p>
                </Form>
              </BlockStack>
            )}
          </section>
          {/* <Text as="p" variant="bodyMd">
              Want to access your visitors consent data? Try our <Link to="https://www.intastellarconsents.com" target="_blank">Intastellar Consents Platform.</Link>
                <Link to="https://www.intastellarsolutions.com/solutions/cookie-consents" target="_blank">Learn more about Intastellar Consents</Link>
              </Text> */}
          <section className={styles.appScreen} aria-label="Install guide video">
            <div className={styles.appScreenFrame}>
              <video
                src={IntastellarShopifyGuideVideo}
                width="100%"
                height="342"
                className={styles.appScreenVideo}
                autoPlay
                muted
                loop
                playsInline
                aria-label="How to install Intastellar Consents on Shopify"
              />
            </div>
          </section>
        </div>

        <section
          className={[styles.section, styles.sectionAlt].join(" ")}
          aria-labelledby="features-heading"
        >
          <span className={styles.sectionEyebrow}>Features</span>
          <h2 id="features-heading" className={styles.sectionTitle}>
            Why merchants choose Intastellar Consents
          </h2>
          <ul className={styles.featureGrid}>
            {LANDING_FEATURES.map((feature, index) => (
              <li key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </li>
            ))}
          </ul>
          <p className={styles.sectionNote}>
            Go further with the{" "}
            <Link to="https://www.intastellarconsents.com" target="_blank" rel="noopener noreferrer">
              Intastellar Consents Platform dashboard
            </Link>
            : see acceptance by country and region, track behavior over time, and
            export reports when you need them.
          </p>
        </section>

        <section className={styles.statsSection} aria-label="Platform statistics">
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>276K+</span>
              <span className={styles.statLabel}>Consent decisions processed</span>
              <span className={styles.statDescription}>Across live websites</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>65%</span>
              <span className={styles.statLabel}>Average consent acceptance rate</span>
              <span className={styles.statDescription}>With clear, compliant UX</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>149</span>
              <span className={styles.statLabel}>Countries</span>
              <span className={styles.statDescription}>Region-aware consent handling</span>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-label="Trusted by">
          <span className={styles.sectionEyebrow}>Trusted by</span>
          <div className={styles.clientLogos}>
          <Image source="https://www.cykelfaergen.info/assets/logo/logo.svg" alt="Cykelfærgen Flensborg fjord logo" className={styles.clientLogo} />
          <Image source="https://asasoftware.aero/wp-content/uploads/2020/04/ASA.svg" alt="ASA Software logo" className={styles.clientLogo} />
          <Image source="https://laesoe-booking.dk/images/logo.png" alt="Laesoe Booking logo" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          <Image source="https://waterless.dk/wp-content/uploads/2025/11/Waterless-scandinavia.png" alt="Waterless Scandinavia logo" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          <Image source="https://vojens-bc.dk/wp-content/uploads/2026/05/vbc-logo-v2-319.png" alt="Vojens Badminton Club logo" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="story-heading">
          <span className={styles.sectionEyebrow}>The problem</span>
          <article className={styles.mainContent}>
            <h2 id="story-heading" className={styles.sectionTitle}>
              How Shopify consent data works (and where it falls short)
            </h2>
          <p>
            Shopify includes built-in consent tracking through its Customer Privacy
            API. When a visitor interacts with your cookie banner, Shopify records
            their choices and assigns a consent ID. This allows your store to
            respect user preferences and meet legal requirements across regions
            like the EU and California.
          </p>
          <p>That part works.</p>
          <p>
            But Shopify focuses on <strong>storing</strong> consent, not helping
            you understand it:
          </p>
          <ul>
            <li>You can’t easily see how users behave after giving or denying consent</li>
            <li>You don’t get a clear, actionable overview of consent patterns</li>
            <li>There’s no simple way to connect consent data with marketing or analytics decisions</li>
            <li>Cross-system visibility is limited, especially when using external tools</li>
          </ul>
          <p>So while the data exists, it’s not built for insight.</p>
          <p>That’s where most store owners end up guessing:</p>
          <ul>
            <li>Which users can actually be tracked</li>
            <li>Whether consent rates are improving</li>
            <li>How consent impacts conversion and campaigns</li>
          </ul>
          <p>
            <strong>Intastellar Consents</strong> bridges that gap by syncing the
            same consent ID across Shopify and Intastellar Consents — turning a static legal
            record into something you can actually use.
          </p>
            <Link to="/shopify-customer-privacy-api">How Intastellar Consents syncs with Shopify's Customer Privacy API →</Link>
          </article>
        </section>

        <section className={styles.section} aria-labelledby="faq-heading">
          <span className={styles.sectionEyebrow}>FAQ</span>
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Frequently asked questions
          </h2>
          <dl className={styles.faq}>
            {LANDING_FAQ.map((item) => (
              <div key={item.question} className={styles.faqItem}>
                <dt className={styles.faqQuestion}>{item.question}</dt>
                <dd className={styles.faqAnswer}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
        </main>
        <footer className={styles.footer}>
          <BlockStack as="div" gap="200">
            <Image source="https://www.intastellar-consents.com/assets/icons/intastellar-logo-black.svg" alt="Intastellar Solutions, International" className={styles.footerLogoImage} />
            <div className={styles.footerLinks}>
              <Link to="/legal/privacy">App Privacy Policy</Link>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <Link to="/legal/terms">App Terms of Use</Link>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <a
                href={INTASTELLAR_SUPPORT_LINKS.helpCenter.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {INTASTELLAR_SUPPORT_LINKS.helpCenter.label}
              </a>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <a
                href={INTASTELLAR_SUPPORT_LINKS.developerDocs.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {INTASTELLAR_SUPPORT_LINKS.developerDocs.label}
              </a>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <Link to="/shopify-customer-privacy-api">Shopify Customer Privacy API</Link>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <Link to="https://www.intastellarsolutions.com/about/legal/privacy" target="_blank" rel="noopener noreferrer">General Privacy</Link>
              <span className={styles.footerDivider} aria-hidden="true">·</span>
              <Link to="https://www.intastellarsolutions.com/about/legal/dpa" target="_blank" rel="noopener noreferrer">DPA</Link>
            </div>
            <Text as="p" variant="bodyMd">
              &copy; {new Date().getFullYear()} Intastellar Solutions, International. All rights reserved.
            </Text>
          </BlockStack>
        </footer>
      </div>
    </AppProvider>
  );
}
