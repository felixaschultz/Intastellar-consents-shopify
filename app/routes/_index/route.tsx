import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import styles from "./styles.module.css";
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
    url: "https://intastellar.eu/legal/privacy",
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

  return null;
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

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
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
];

const COMPLIANCE_BADGES = ["GDPR", "CCPA/CPRA", "LGPD", "POPIA", "PDPA", "DMA"];

function FeatureIcon({ index }: { index: number }) {
  const icons: Array<{ viewBox?: string; paths: string[]; extra?: JSX.Element }> = [
    { paths: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"] },
    { paths: ["M3 3v18h18", "m7 15 4-4 3 3 5-6"] },
    {
      paths: [
        "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7",
        "M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
      ],
    },
    {
      paths: ["M3 12h18", "M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"],
      extra: <circle cx="12" cy="12" r="9" />,
    },
    {
      paths: ["M7 14v2M12 10v6M17 7v9"],
      extra: <rect x="3" y="4" width="18" height="16" rx="2" />,
    },
    {
      paths: ["M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z", "m9 12 2 2 4-4"],
    },
  ];
  const icon = icons[index] ?? icons[0];
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon.extra}
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const AD_CHANNELS = [
  { label: "Google Search · Brand", pct: 78 },
  { label: "Meta · Retargeting", pct: 54 },
  { label: "Google PMax", pct: 41 },
  { label: "TikTok · Prospecting", pct: 33 },
];

const COMPARISON_ROWS = [
  {
    label: "Stores consent via Customer Privacy API",
    builtIn: "Yes",
    intastellar: "Yes, same consent ID",
  },
  {
    label: "Consent analytics by country & device",
    builtIn: "No",
    intastellar: "Yes",
  },
  {
    label: "Ad-click vs. consent reconciliation",
    builtIn: "No",
    intastellar: "Yes",
  },
];

export default function App() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <header className={styles.siteHeader}>
        <div className={styles.siteHeaderInner}>
          <Link to="#top" className={styles.logoLink}>
            <img
              src="https://intastellar.eu/assets/logos/intastellar-consents-logo.svg"
              alt="Intastellar Consents by Intastellar Solutions, International"
              className={styles.logoImage}
            />
            <span className={styles.forShopifyPill}>for Shopify</span>
          </Link>
          <nav aria-label="Main" className={styles.mainNav}>
            <a href="#features">Features</a>
            <a href="#ads">Ad tracking</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles.headerActions}>
            <Link to="/auth/login" className={styles.headerLoginBtn}>
              Log in
            </Link>
            <a href="#install" className={styles.headerInstallBtn}>
              Install free
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section id="top" className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroInner}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              Free to install · EU-hosted · Shopify Customer Privacy API
            </span>
            <h1 id="hero-heading" className={styles.heading}>
              Cookie consent for Shopify that{" "}
              <span className={styles.headingAccent}>keeps your ads tracking</span>
            </h1>
            <p className={styles.lead}>
              Google Consent Mode v2, Meta Pixel and Shopify&rsquo;s Customer Privacy
              API all receive the same consent signal. Compliant under GDPR, CCPA and
              other major privacy laws, with no theme code to edit.
            </p>

            <Form id="install" className={styles.installForm} method="post" action="/auth/login">
              <label className={styles.installLabel} htmlFor="shop">
                Shop domain
              </label>
              <input
                id="shop"
                className={styles.installInput}
                type="text"
                name="shop"
                autoComplete="url"
                placeholder="your-store.myshopify.com"
                required
              />
              <button className={styles.installButton} type="submit">
                Install on Shopify →
              </button>
            </Form>
            <p className={styles.formLegal}>
              Opens in your Shopify admin · Free plan available · By continuing you
              agree to the <Link to={APP_LEGAL_LINKS.terms}>App Terms</Link> and{" "}
              <Link to={APP_LEGAL_LINKS.privacy}>Privacy Policy</Link>
            </p>

            <div className={styles.complianceRow}>
              <span className={styles.complianceLabel}>Compliant with</span>
              {COMPLIANCE_BADGES.map((badge) => (
                <span key={badge} className={styles.complianceBadge}>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.previewFrame} aria-hidden="true">
            <div className={styles.previewChrome}>
              <span className={styles.previewDot} />
              <span className={styles.previewDot} />
              <span className={styles.previewDot} />
              <span className={styles.previewUrl}>your-store.myshopify.com</span>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewStoreBar}>
                <span className={styles.previewStoreName}>Your Store</span>
                <span className={styles.previewStoreNav}>
                  <span>Shop</span>
                  <span>Collections</span>
                  <span>About</span>
                  <span>Cart (0)</span>
                </span>
              </div>
              <div className={styles.previewGrid}>
                <div className={styles.previewTile} />
                <div className={styles.previewTile} />
                <div className={styles.previewTile} />
                <div className={styles.previewTile} />
              </div>
              <div
                role="dialog"
                aria-label="Cookie consent banner preview"
                className={styles.previewBanner}
              >
                <div className={styles.previewBannerTitle}>We value your privacy</div>
                <div className={styles.previewBannerBody}>
                  We use cookies to run the store, measure traffic and show relevant
                  ads. Choose what you allow.
                </div>
                <div className={styles.previewBannerActions}>
                  <span className={styles.previewBtn}>Accept all</span>
                  <span className={styles.previewBtn}>Reject all</span>
                  <span className={styles.previewBtnGhost}>Settings</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionNavy} aria-label="Key numbers">
          <div className={styles.statsGrid}>
            <div className={styles.statCell}>
              <div className={styles.statNumber}>276K+</div>
              <div className={styles.statLabel}>consent choices managed</div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statNumber}>149</div>
              <div className={styles.statLabel}>countries served automatically</div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statNumber}>65%</div>
              <div className={styles.statLabel}>avg. opt-in rate, no dark patterns</div>
            </div>
            <div className={styles.statCell}>
              <div className={styles.statNumber}>~2 min</div>
              <div className={styles.statLabel}>average time to go live</div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-label="Trusted by">
          <div className={styles.trustedByLabel}>TRUSTED BY</div>
          <div className={styles.clientLogos}>
            <img
              src="https://www.cykelfaergen.info/assets/logo/logo.svg"
              alt="Cykelfærgen Flensborg fjord logo"
              className={styles.clientLogo}
              loading="lazy"
            />
            <img
              src="https://asasoftware.aero/wp-content/uploads/2020/04/ASA.svg"
              alt="ASA Software logo"
              className={styles.clientLogo}
              loading="lazy"
            />
            <img
              src="https://laesoe-booking.dk/images/logo.png"
              alt="Læsø Booking logo"
              className={`${styles.clientLogo} ${styles.largerLogo}`}
              loading="lazy"
            />
            <img
              src="https://waterless.dk/wp-content/uploads/2025/11/Waterless-scandinavia.png"
              alt="Waterless Scandinavia logo"
              className={`${styles.clientLogo} ${styles.largerLogo}`}
              loading="lazy"
            />
            <img
              src="https://vojens-bc.dk/wp-content/uploads/2026/05/vbc-logo-v2-319.png"
              alt="Vojens Badminton Club logo"
              className={`${styles.clientLogo} ${styles.largerLogo}`}
              loading="lazy"
            />
          </div>
        </section>

        <section id="features" className={styles.section} aria-labelledby="features-heading">
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Features</span>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Everything a Shopify store needs. Nothing it doesn&rsquo;t.
            </h2>
          </div>
          <ul className={styles.featureGrid}>
            {LANDING_FEATURES.map((feature, index) => (
              <li key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <FeatureIcon index={index} />
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="ads" className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="ads-heading">
          <div className={styles.adSection}>
            <div className={styles.adCopy}>
              <span className={styles.sectionEyebrow}>Ad platform reconciliation</span>
              <h2 id="ads-heading" className={styles.sectionTitle}>
                Stop paying for ad clicks that vanish after the consent wall
              </h2>
              <p className={styles.adLead}>
                Compare paid clicks from Google and Meta with what your analytics
                actually sees after consent. Find out which campaigns lose the most
                and what each consented visitor costs.
              </p>
              <ul className={styles.adChecklist}>
                <li>
                  <span className={styles.adCheck}>✓</span>Clicks vs. consented
                  sessions, per campaign
                </li>
                <li>
                  <span className={styles.adCheck}>✓</span>Cost per consented visitor
                </li>
                <li>
                  <span className={styles.adCheck}>✓</span>Before/after snapshots when
                  you change the banner
                </li>
              </ul>
              <div className={styles.adCtaRow}>
                <a href="#install" className={styles.installButton}>
                  Start free trial →
                </a>
                <span className={styles.adCtaNote}>Included on the Pro plan</span>
              </div>
            </div>
            <div className={styles.adCard}>
              <div className={styles.adCardHead}>
                <span>Campaign visibility</span>
                <span className={styles.adCardHeadNote}>Illustrative example</span>
              </div>
              <div className={styles.adBars}>
                {AD_CHANNELS.map((channel) => (
                  <div key={channel.label}>
                    <div className={styles.adBarLabel}>
                      <span>{channel.label}</span>
                      <span>{channel.pct}% visible</span>
                    </div>
                    <div className={styles.adBarTrack}>
                      <div
                        className={styles.adBarFill}
                        style={{ width: `${channel.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.adCardFoot}>
                <span>% of clicks visible in analytics</span>
                <span>cost / consent</span>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className={styles.section} aria-labelledby="how-heading">
          <div className={styles.sectionHeadCentered}>
            <span className={styles.sectionEyebrow}>How it works</span>
            <h2 id="how-heading" className={styles.sectionTitle}>
              Live in three steps
            </h2>
          </div>
          <div className={styles.stepGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Install the app</h3>
              <p className={styles.stepBody}>
                Enter your store domain above and approve the permissions in Shopify
                admin.
              </p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Style your banner</h3>
              <p className={styles.stepBody}>
                Pick colors, copy and cookie categories. Your privacy policy link is
                filled in automatically.
              </p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Enable the app embed</h3>
              <p className={styles.stepBody}>
                Online Store → Themes → Customize → App embeds. Toggle it on and save.
                Done.
              </p>
            </div>
          </div>
          <div className={styles.installDemo}>
            <div className={styles.installDemoFrame}>
              <video
                src={IntastellarShopifyGuideVideo}
                width="100%"
                height="342"
                className={styles.installDemoVideo}
                autoPlay
                muted
                loop
                playsInline
                aria-label="How to install Intastellar Consents on Shopify"
              />
            </div>
            <p className={styles.installDemoCaption}>
              The install flow, start to finish, inside Shopify admin.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="compare-heading">
          <div className={styles.sectionHeadCentered}>
            <span className={styles.sectionEyebrow}>Why not Shopify&rsquo;s built-in banner?</span>
            <h2 id="compare-heading" className={styles.sectionTitle}>
              Shopify stores consent. We help you use it.
            </h2>
          </div>
          <div className={styles.compareWrap}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th aria-hidden="true"></th>
                  <th>Shopify built-in</th>
                  <th>Intastellar Consents</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.builtIn}</td>
                    <td>{row.intastellar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.sectionNote}>
            <Link to="/shopify-customer-privacy-api">
              Read: how Shopify consent data works, and where it falls short →
            </Link>
          </p>
        </section>

        <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
          <div className={styles.sectionHeadCentered}>
            <span className={styles.sectionEyebrow}>Pricing</span>
            <h2 id="pricing-heading" className={styles.sectionTitle}>
              Free to start. Upgrade when you need insight.
            </h2>
          </div>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingName}>Free</div>
              <div>
                <span className={styles.pricingPrice}>€0</span>
                <span className={styles.pricingPriceUnit}> / month</span>
              </div>
              <ul className={styles.pricingList}>
                <li>✓ Cookie banner &amp; Customer Privacy API sync</li>
                <li>✓ Google Consent Mode v2</li>
                <li>✓ Unlimited banner views</li>
              </ul>
              <a href="#install" className={styles.pricingCta}>
                Install free
              </a>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <span className={styles.pricingBadge}>Most popular</span>
              <div className={styles.pricingName}>Pro</div>
              <div>
                <span className={styles.pricingPrice}>Pricing</span>
                <span className={styles.pricingPriceUnit}> coming soon</span>
              </div>
              <ul className={styles.pricingList}>
                <li>✓ Everything in Free</li>
                <li>✓ Consent analytics dashboard</li>
                <li>✓ Ad-platform reconciliation</li>
              </ul>
              <a
                href={INTASTELLAR_SUPPORT_LINKS.helpCenter.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.pricingCta} ${styles.pricingCtaPrimary}`}
              >
                Contact us
              </a>
            </div>
          </div>
        </section>

        <section id="faq" className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="faq-heading">
          <div className={styles.sectionHeadCentered}>
            <span className={styles.sectionEyebrow}>FAQ</span>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Frequently asked questions
            </h2>
          </div>
          <dl className={styles.faq}>
            {LANDING_FAQ.map((item) => (
              <div key={item.question} className={styles.faqItem}>
                <dt className={styles.faqQuestion}>{item.question}</dt>
                <dd className={styles.faqAnswer}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.sectionNavy} aria-labelledby="final-cta-heading">
          <div className={styles.finalCta}>
            <h2 id="final-cta-heading" className={styles.sectionTitle}>
              Your consent banner should feed your analytics
            </h2>
            <p className={styles.finalCtaLead}>
              Install free in two minutes. Upgrade only when you want the insight.
            </p>
            <a href="#install" className={styles.finalCtaButton}>
              Install on Shopify →
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>
            &copy; {new Date().getFullYear()} Intastellar Solutions, International
          </span>
          <nav aria-label="Footer" className={styles.footerLinks}>
            <Link to="/legal/privacy">App Privacy Policy</Link>
            <Link to="/legal/terms">App Terms</Link>
            <Link
              to="https://www.intastellarsolutions.com/about/legal/dpa"
              target="_blank"
              rel="noopener noreferrer"
            >
              DPA
            </Link>
            <a
              href={INTASTELLAR_SUPPORT_LINKS.helpCenter.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {INTASTELLAR_SUPPORT_LINKS.helpCenter.label}
            </a>
            <a
              href={INTASTELLAR_SUPPORT_LINKS.developerDocs.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {INTASTELLAR_SUPPORT_LINKS.developerDocs.label}
            </a>
            <Link to="/shopify-customer-privacy-api">Customer Privacy API</Link>
            <Link to="https://intastellar.eu" target="_blank" rel="noopener noreferrer">
              intastellar.eu
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
