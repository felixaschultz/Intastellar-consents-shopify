import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { AppProvider, BlockStack, Image, Text } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";
import logo from "../../assets/combined-intastellar-shopify.svg";
import appScreen from "../../assets/app-screen.png";
import { loginErrorMessage } from "../auth.login/error.server";
import { useEffect, useState } from "react";
import IntastellarShopifyGuideVideo from "../../assets/vid/Intastellar Consents - Shopify Install Guide.mp4";
import { PILOT_CMP_OPTIONS } from "../../lib/pilot-lead-cmp-options";
import { isPilotStoreProvisioningConfigured } from "../../lib/partner-dev-store.server";
import { startPilotSignup } from "../../lib/pilot-lead.server";

/** JSON-LD for this landing route; root reads `handle.jsonLdSchema` into `<head>`. */
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Intastellar Consents",
  description:
    "Intastellar Consents is a Shopify app that helps you manage your cookie consents and preferences in one place.",
  url: "https://www.intastellarconsents.com/",
  publisher: {
    "@type": "Organization",
    "@id": "https://www.intastellarsolutions.com/#organization",
    name: "Intastellar Solutions International",
    url: "https://www.intastellarsolutions.com/",
    logo: "https://www.intastellarconsents.com/assets/icons/intastellar-logo-black.svg",
    logoWidth: 100,
    logoHeight: 100,
    logoType: "image/svg+xml",
    logoAlt: "Intastellar Consents",
  },
  about: [
    {
      "@type": "SoftwareApplication",
      name: "Intastellar Consents",
    },
  ],
  inLanguage: "en-US",
};

/** Marketing-site banner config — scoped to `/` only via root `handle` (never on embedded `/app`). */
const landingIntaConfig = {
  policy_link: {
    url: "https://www.intastellarsolutions.com/about/legal/privacy",
    target: "_blank",
  },
  settings: {
    rootDomain:
      process.env.VITE_INTA_LANDING_ROOT_DOMAIN || "consentsplatform.com",
    company: "Intastellar Solutions International",
    color: "rgb(163, 133, 64)",
    language: "auto",
    gtagId: "G-86T4LDB766",
    arrange: "rtl",
    design: "bannerV2",
    requiredCookies: [],
    keepInLocalStorage: [],
    logo: "/assets/combined-intastellar-shopify.svg",
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
      async: false,
    },
  ],
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  const showManualInstall =
    url.searchParams.get("install") === "direct";

  return {
    showForm: Boolean(login),
    polarisTranslations,
    pilotProvisioningEnabled: isPilotStoreProvisioningConfigured(),
    cmpOptions: PILOT_CMP_OPTIONS,
    showManualInstall,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  if (intent === "pilot") {
    try {
      const honeypot = String(form.get("company_website") ?? "").trim();
      if (honeypot) {
        return json({ intent: "pilot" as const, ok: false as const, message: "Thanks." });
      }

      const result = await startPilotSignup({
        email: String(form.get("email") ?? ""),
        storeName: String(form.get("storeName") ?? ""),
        cmpValue: String(form.get("currentCmp") ?? ""),
        cmpOther: String(form.get("cmpOther") ?? ""),
      });

      if (!result.ok) {
        return json({
          intent: "pilot" as const,
          ok: false as const,
          message: result.message,
          fieldErrors: result.fieldErrors ?? {},
        });
      }

      return json({
        intent: "pilot" as const,
        ok: true as const,
        pollToken: result.pollToken,
        shopDomain: result.shopDomain,
        email: result.email,
      });
    } catch (err) {
      console.error("[index] pilot action failed", err);
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      return json({
        intent: "pilot" as const,
        ok: false as const,
        message: `We could not start your demo store setup: ${message}`,
      });
    }
  }

  const errors = loginErrorMessage(await login(request));

  return {
    intent: "install" as const,
    errors,
  };
};

export const meta = () => {
  return [
    { title: "Intastellar Consents: Consent management for your Shopify store" },
    { description: "Intastellar Consents is a Shopify app that helps you manage your cookie consents and preferences in one place." },
    { property: "og:image", content: appScreen },
    { property: "og:title", content: "Intastellar Consents: Consent management for your Shopify store" },
    { property: "og:description", content: "Intastellar Consents is a Shopify app that helps you manage your cookie consents and preferences in one place." },
    { property: "og:url", content: "https://www.intastellarsolutions.com/solutions/cookie-consents" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Intastellar Consents" },
    { property: "og:locale", content: "en_US" },
    { property: "og:locale:alternate", content: "en_US" },
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
    pilotProvisioningEnabled,
    cmpOptions,
    showManualInstall: showManualInstallFromLoader,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const pollFetcher = useFetcher<typeof import("../pilot-lead.poll").loader>();
  const [pilotCmp, setPilotCmp] = useState("none");
  const [provisioning, setProvisioning] = useState<{
    pollToken: string;
    shopDomain: string;
    message: string;
  } | null>(null);

  const installErrors =
    actionData && "intent" in actionData && actionData.intent === "install"
      ? actionData.errors
      : undefined;
  const showManualInstall =
    searchParams.get("install") === "direct" ||
    showManualInstallFromLoader ||
    Boolean(installErrors);
  const pilotResult =
    actionData && "intent" in actionData && actionData.intent === "pilot"
      ? actionData
      : null;

  useEffect(() => {
    if (pilotResult?.ok && "pollToken" in pilotResult) {
      setProvisioning({
        pollToken: pilotResult.pollToken,
        shopDomain: pilotResult.shopDomain,
        message: "Setting up your demo store…",
      });
    }
  }, [pilotResult]);

  useEffect(() => {
    if (!provisioning) return;
    const interval = window.setInterval(() => {
      pollFetcher.load(
        `/pilot-lead/poll?token=${encodeURIComponent(provisioning.pollToken)}`,
      );
    }, 2500);
    pollFetcher.load(
      `/pilot-lead/poll?token=${encodeURIComponent(provisioning.pollToken)}`,
    );
    return () => window.clearInterval(interval);
  }, [provisioning?.pollToken]);

  useEffect(() => {
    const data = pollFetcher.data;
    if (!data?.ok || !provisioning) return;
    if (data.status === "READY" && data.installPath) {
      window.location.href = data.installPath;
      return;
    }
    if (data.status === "FAILED") {
      setProvisioning(null);
      return;
    }
    if (data.message && data.message !== provisioning.message) {
      setProvisioning((prev) =>
        prev ? { ...prev, message: data.message } : prev,
      );
    }
  }, [pollFetcher.data, provisioning]);

  const pollFailed =
    pollFetcher.data && !pollFetcher.data.ok
      ? pollFetcher.data.message
      : pollFetcher.data?.ok && pollFetcher.data.status === "FAILED"
        ? pollFetcher.data.message
        : null;

  useEffect(() => {
    if (!showManualInstall) return;
    document.getElementById("install-direct")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [showManualInstall]);
  return (
    <AppProvider i18n={polarisTranslations}>
      <div className={styles.index}>
        <header>
          <Link className={styles.logoLink} to="https://www.intastellarsolutions.com/solutions/cookie-consents" target="_blank">
            <Image source={logo} alt="Intastellar Consents" className={styles.logoImage} />
            <span className={styles.comingSoon}>Coming Soon</span>
          </Link>
        </header>
        <h1 className={styles.heading}>
          Understand Shopify consent data. Not just store it.
        </h1>
        <h2 className={styles.subheading}>Same Consent ID across Shopify and Intastellar Consents</h2>
        <div className={styles.content}>
          <section className={styles.formSection}>
            {showForm && (
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <div className={styles.formIntro}>
                    <Text as="p" variant="bodyMd">
                      Try Intastellar Consents on a free Shopify demo store — we
                      create it for you, install the app, and open the admin so you
                      can configure the banner in minutes.
                    </Text>
                    {!pilotProvisioningEnabled ? (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Automated demo setup runs when partner provisioning is
                        enabled on the server. You can still install on an existing
                        development store below.
                      </Text>
                    ) : null}
                  </div>
                </BlockStack>

                {provisioning ? (
                  <div className={styles.pilotStatus}>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {provisioning.message}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {provisioning.shopDomain} — you&apos;ll be redirected to
                      approve the app when the store is ready.
                    </Text>
                  </div>
                ) : (
                  <Form
                    className={[styles.form, styles.pilotForm].join(" ")}
                    method="post"
                    action="?index"
                  >
                    <input type="hidden" name="intent" value="pilot" />
                    <input
                      type="text"
                      name="company_website"
                      className={styles.honeypot}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />
                    <div className={styles.pilotFormGrid}>
                      <label className={styles.label}>
                        <span className={styles.labelTitle}>Work email</span>
                        <input
                          className={[
                            styles.input,
                            pilotResult?.fieldErrors?.email ? styles.error : "",
                          ].join(" ")}
                          type="email"
                          name="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                        />
                        {pilotResult?.fieldErrors?.email ? (
                          <span className={[styles.errorText, styles.helpText].join(" ")}>
                            {pilotResult.fieldErrors.email}
                          </span>
                        ) : null}
                      </label>
                      <label className={styles.label}>
                        <span className={styles.labelTitle}>Store name</span>
                        <input
                          className={[
                            styles.input,
                            pilotResult?.fieldErrors?.storeName ? styles.error : "",
                          ].join(" ")}
                          type="text"
                          name="storeName"
                          placeholder="e.g. Acme Demo Store"
                        />
                        {pilotResult?.fieldErrors?.storeName ? (
                          <span className={[styles.errorText, styles.helpText].join(" ")}>
                            {pilotResult.fieldErrors.storeName}
                          </span>
                        ) : (
                          <span className={styles.helpText}>
                            Used as the name of your Shopify development store
                          </span>
                        )}
                      </label>
                      <label className={[styles.label, styles.fieldFull].join(" ")}>
                        <span className={styles.labelTitle}>
                          Current cookie banner (CMP)
                        </span>
                        <select
                          className={[
                            styles.input,
                            styles.select,
                            pilotResult?.fieldErrors?.currentCmp ? styles.error : "",
                          ].join(" ")}
                          name="currentCmp"
                          value={pilotCmp}
                          onChange={(e) => setPilotCmp(e.target.value)}
                        >
                          {cmpOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {pilotResult?.fieldErrors?.currentCmp ? (
                          <span className={[styles.errorText, styles.helpText].join(" ")}>
                            {pilotResult.fieldErrors.currentCmp}
                          </span>
                        ) : null}
                      </label>
                      {pilotCmp === "other" ? (
                        <label className={[styles.label, styles.fieldFull].join(" ")}>
                          <span className={styles.labelTitle}>Which CMP?</span>
                          <input
                            className={[
                              styles.input,
                              pilotResult?.fieldErrors?.cmpOther ? styles.error : "",
                            ].join(" ")}
                            type="text"
                            name="cmpOther"
                            placeholder="e.g. Custom in-house banner"
                          />
                          {pilotResult?.fieldErrors?.cmpOther ? (
                            <span className={[styles.errorText, styles.helpText].join(" ")}>
                              {pilotResult.fieldErrors.cmpOther}
                            </span>
                          ) : null}
                        </label>
                      ) : null}
                    </div>
                    {pilotResult && !pilotResult.ok && "message" in pilotResult ? (
                      <p className={[styles.errorText, styles.formErrorBanner].join(" ")}>
                        {pilotResult.message}
                      </p>
                    ) : null}
                    {pollFailed ? (
                      <p className={[styles.errorText, styles.formErrorBanner].join(" ")}>
                        {pollFailed}
                      </p>
                    ) : null}
                    <button
                      className={styles.button}
                      type="submit"
                      disabled={!pilotProvisioningEnabled}
                    >
                      Start free demo
                    </button>
                  </Form>
                )}

                <div className={styles.formFooter}>
                  {showManualInstall ? (
                    <Link to="/" className={styles.textButton}>
                      Hide manual install
                    </Link>
                  ) : (
                    <Link to="?install=direct" className={styles.textButton}>
                      Already have a Shopify store? Install directly
                    </Link>
                  )}
                </div>

                {showManualInstall ? (
                  <div id="install-direct" className={styles.manualInstallPanel}>
                    <Text as="p" variant="bodyMd">
                      Enter your <code>your-store.myshopify.com</code> address to
                      install on an existing development store.
                    </Text>
                    <Form className={styles.form} method="post" action="?index">
                      <input type="hidden" name="intent" value="install" />
                      <label className={styles.label}>
                        <span className={styles.labelTitle}>Shop domain</span>
                        <input
                          placeholder="e.g. my-shop.myshopify.com"
                          className={[
                            styles.input,
                            installErrors?.shop ? styles.error : "",
                          ].join(" ")}
                          type="text"
                          name="shop"
                        />
                        {installErrors?.shop ? (
                          <span className={[styles.errorText, styles.helpText].join(" ")}>
                            {installErrors.shop}
                          </span>
                        ) : (
                          <span className={styles.helpText}>
                            Development stores on your Partner account work before
                            App Store approval
                          </span>
                        )}
                      </label>
                      <button className={styles.buttonSecondary} type="submit">
                        Install now
                      </button>
                    </Form>
                  </div>
                ) : null}
              </BlockStack>
            )}
            <Text as="p" variant="bodyMd" tone="subdued">
              Without clear consent data, you’re guessing.
            </Text>
          </section>
          {/* <Text as="p" variant="bodyMd">
              Want to access your visitors consent data? Try our <Link to="https://www.intastellarconsents.com" target="_blank">Intastellar Consents Platform.</Link>
                <Link to="https://www.intastellarsolutions.com/solutions/cookie-consents" target="_blank">Learn more about Intastellar Consents</Link>
              </Text> */}
          <section className={styles.appScreen}>
            <video src={IntastellarShopifyGuideVideo} width="100%" height="342px" className={styles.appScreenVideo} autoPlay muted loop></video>
          </section>
        </div>
        <div className={styles.content}>
          <BlockStack gap="200">
            <h2 className={styles.subheading}>
              Consistent across Shopify and Intastellar
            </h2>
            <Text as="p" variant="bodyMd">
              Each consent is tracked using the same ID in both systems — no mismatches, no confusion.
            </Text>
          </BlockStack>
          <BlockStack gap="200">
            <h2 className={styles.subheading}>
              Built for clarity
            </h2>
            <Text as="p" variant="bodyMd">
              Shopify keeps the full legal record. Intastellar gives you the insights — with a cleaner, analytics-focused view of user consent behavior.
            </Text>
          </BlockStack>
        </div>
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            Go further with the <Link to="https://www.intastellarconsents.com" target="_blank">Intastellar dashboard</Link>:
            Understand how users actually respond to your banner - by country, region, and behavior — and export reports when you need them.
          </Text>
        </BlockStack>
        <BlockStack gap="200">
            <ul className={styles.list}>
              {/* Add the features of the Intastellar Consents app here */}
              <li>
                GDPR, CCPA & DMA compliant
              </li>
              <li>
                Hosted securely in the EU
              </li>
              <li>
                Google Consent Mode (incl. Advanced)
              </li>
              <li>
                Shopify Customer Privacy API
              </li>
            </ul>
        </BlockStack>
        <BlockStack gap="200">
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>276K+</span>
                <span className={styles.statLabel}>Consent decisions processed</span>
                <span className={styles.statDescription}>— Across live websites</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>65%</span>
                <span className={styles.statLabel}>Average consent acceptance rate</span>
                <span className={styles.statDescription}>— With clear, compliant UX</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>149</span>
                <span className={styles.statLabel}>Countries</span>
                <span className={styles.statDescription}>— Region-aware consent handling</span>
              </div>
            </div>
        </BlockStack>
        <div className={styles.clientLogos}>
          <Image source="https://www.cykelfaergen.info/assets/logo/logo.svg" alt="Cykelfærgen Flensborg fjord" className={styles.clientLogo} />
          <Image source="https://asasoftware.aero/wp-content/uploads/2020/04/ASA.svg" alt="ASA Software" className={styles.clientLogo} />
          <Image source="https://laesoe-booking.dk/images/logo.png" alt="Laesoe Booking" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          <Image source="https://waterless.dk/wp-content/uploads/2025/11/Waterless-scandinavia.png" alt="Waterless" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          <Image source="https://www.wbrbh.de/wp-content/uploads/2026/02/horsthemke.webp" alt="Horst Heimke" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
        </div>
        <div className={styles.mainContent}>
          <BlockStack gap="200">
            <h2 className={styles.subheading}>How Shopify consent data works (and where it falls short)</h2>
            <Text as="p" variant="bodyMd">
              Shopify includes built-in consent tracking through its Customer Privacy API. When a visitor interacts with your cookie banner, Shopify records their choices and assigns a consent ID. This allows your store to respect user preferences and meet legal requirements across regions like the EU and California.
            </Text>
            <Text as="p" variant="bodyMd">That part works.</Text>
            <Text as="p" variant="bodyMd">
              But here’s the limitation:
            </Text>
            <Text as="p" variant="bodyMd">
              Shopify focuses on storing consent, not helping you understand it.
            </Text>
            <ul>
              <li>You can’t easily see how users behave after giving or denying consent</li>
              <li>You don’t get a clear, actionable overview of consent patterns</li>
              <li>There’s no simple way to connect consent data with marketing or analytics decisions</li>
              <li>Cross-system visibility is limited, especially when using external tools</li>
            </ul>
            <Text as="p" variant="bodyMd">
              So while the data exists, it’s not built for insight.
            </Text>
            <Text as="p" variant="bodyMd">
              That’s where most store owners end up guessing:
            </Text>
            <ul>
              <li>Which users can actually be tracked</li>
              <li>Whether consent rates are improving</li>
              <li>How consent impacts conversion and campaigns</li>
            </ul>
            <Text as="p" variant="bodyMd">
              Intastellar Consents bridges that gap.
            </Text>
            <Text as="p" variant="bodyMd">
              By syncing the same consent ID across Shopify and Intastellar, you get a consistent view of consent data across systems — turning a static legal record into something you can actually use.
            </Text>
          </BlockStack>
        </div>
      </div>
      <footer className={styles.footer}>
        <BlockStack as="div" gap="200">
          <Image source="https://www.intastellar-consents.com/assets/icons/intastellar-logo-black.svg" alt="Intastellar Solutions, International" className={styles.footerLogoImage} />
          <div className={styles.footerLinks}>
            <Link to="https://www.intastellarsolutions.com/about/legal/privacy" target="_blank">Privacy Policy</Link> | 
            <Link to="https://www.intastellarsolutions.com/about/legal/terms" target="_blank">Terms of Service</Link> | 
            <Link to="https://www.intastellarsolutions.com/about/legal/dpa" target="_blank">Data Processing Agreement</Link>
          </div>
          <Text as="p" variant="bodyMd">
            &copy; {new Date().getFullYear()} Intastellar Solutions, International. All rights reserved.
          </Text>
        </BlockStack>
      </footer>
    </AppProvider>
  );
}
