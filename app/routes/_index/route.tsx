import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { AppProvider, BlockStack, Image, Modal, Text } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";
import logo from "../../assets/combined-intastellar-shopify.svg";
import appScreen from "../../assets/app-screen.png";
import { loginErrorMessage } from "../auth.login/error.server";
import { useState } from "react";
import IntastellarShopifyGuideVideo from "../../assets/vid/Intastellar Consents - Shopify Install Guide.mp4";

/**
 * Read in root via useMatches() to inject GTM only on this route (not in the embedded app).
 * Set `VITE_GTM_CONTAINER_ID=GTM-XXXX` in `.env`.
 */
export const handle = {
  googleTagManagerId: process.env.VITE_GTM_CONTAINER_ID || "",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login), polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
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
  const { showForm, polarisTranslations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    console.log("openModal");
    setIsModalOpen(true);
  };
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
          Consent management for your Shopify store - for free
        </h1>
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            Start integrating Intastellar Consents into your Shopify store in minutes. The use of the Intastellar Consents app & banner is free for all Shopify stores.
          </Text>
          <Text as="p" variant="bodyMd">
              Intastellar Consents syncs consent decisions with your Shopify store, via the Shopify Customer Privacy API, so you can access them in your Shopify admin <br /> - while getting a advanced analytics dashboard for your consent decisions with <Link to="https://www.intastellarconsents.com" target="_blank">Intastellar CMP</Link>, our consent management platform.
          </Text>
        </BlockStack>
        <div className={styles.content}>
          <section>
            {showForm && (
              <Form className={styles.form} method="post" /* action="/auth/login" */>
                <label className={styles.label}>
                  <span>Shop domain</span>
                  <input placeholder="e.g. my-shop.myshopify.com or your custom domain (e.g. yourstore.com)" className={[styles.input, errors?.shop ? styles.error : ""].join(" ")} type="text" name="shop" />
                  {errors?.shop ? <span className={[styles.errorText, styles.helpText].join(" ")}>{errors.shop}</span> : <span className={styles.helpText}>e.g. my-shop.myshopify.com or your custom domain (e.g. yourstore.com)</span> }
                </label>
                <button className={styles.button} type="submit">
                  Log in
                </button>
              </Form>
            )}
            {showForm && (
              <Text as="p" variant="bodyMd" tone="subdued">
                Don&apos;t have a store yet?{" "}
                <Link
                  to="https://www.shopify.com/free-trial"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Create a Shopify store (free trial),
                </Link>
                 then return here to install the app.
              </Text>
            )}
          </section>
          <section className={styles.appScreen}>
            {/* <button
              type="button"
              onClick={() => {
                console.log("onClick");
              }}
              className={styles.appScreenImageButton}
              aria-label="View app demo"
            >
              <Image source={appScreen} alt="Intastellar Consents" className={styles.featuresImage} />
            </button> */}
            <video src={IntastellarShopifyGuideVideo} width="100%" height="342px" className={styles.appScreenVideo} autoPlay muted loop></video>
            <Text as="p" variant="bodyMd">
              Want to access your visitors consent data? Try our <Link to="https://www.intastellarconsents.com" target="_blank">Intastellar Consents Platform.</Link>
                <Link to="https://www.intastellarsolutions.com/solutions/cookie-consents" target="_blank">Learn more about Intastellar Consents</Link>
              </Text>
          </section>
            <Modal
              open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Intastellar Consents Platform"
            primaryAction={{ content: "Close", onAction: () => setIsModalOpen(false) }}
          >
            <video src={IntastellarShopifyGuideVideo}></video>
          </Modal>
        </div>
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
          <Image source="https://inta.dev/waterless/wordpress/wp-content/uploads/2025/09/cropped-waterless-logo-2.png" alt="Waterless" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
          <Image source="https://www.wbrbh.de/wp-content/uploads/2026/02/horsthemke.webp" alt="Horst Heimke" className={[styles.clientLogo, styles.largerLogo].join(" ")} />
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
