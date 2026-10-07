import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
  APP_LEGAL_LINKS,
  APP_NAME,
  GENERAL_LEGAL_LINKS,
  GENERAL_LEGAL_DOC_LABELS,
  LEGAL_COMPANY,
  LEGAL_LAST_UPDATED,
} from "../lib/legal-content";
import styles from "./legal/styles.module.css";

export const meta: MetaFunction = () => [
  {
    title: `Legal — ${APP_NAME} for Shopify`,
  },
  {
    name: "description",
    content: `Legal documents for the ${APP_NAME} Shopify app, supplementing ${LEGAL_COMPANY}'s general privacy policy, terms, and DPA.`,
  },
  { name: "robots", content: "index, follow" },
];

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

export default function LegalHubPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.homeLink}>
            ← {APP_NAME} for Shopify
          </Link>
          <span className={styles.docType}>Legal</span>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Legal documents</h1>
        <p className={styles.meta}>
          Last updated {LEGAL_LAST_UPDATED} · {LEGAL_COMPANY}
        </p>
        <p>
          The {APP_NAME} Shopify app has its own supplemental privacy policy and
          terms of use. {LEGAL_COMPANY}&apos;s general policies and DPA still apply
          to overall data processing, consent platform services, and contractual
          relationships.
        </p>

        <div className={styles.hubGrid}>
          <Link to={APP_LEGAL_LINKS.privacy} className={styles.hubCard}>
            <p className={styles.hubCardTitle}>App Privacy Policy</p>
            <p className={styles.hubCardDesc}>
              What this Shopify app collects, stores, and shares — including
              merchant admin data, demo signup, and storefront consent handling.
            </p>
          </Link>
          <Link to={APP_LEGAL_LINKS.terms} className={styles.hubCard}>
            <p className={styles.hubCardTitle}>App Terms of Use</p>
            <p className={styles.hubCardDesc}>
              Rules for installing and using the app on Shopify, merchant
              responsibilities, and relationship to the free banner and Platform.
            </p>
          </Link>
        </div>

        <section className={styles.related} aria-labelledby="general-legal">
          <h2 id="general-legal" className={styles.relatedTitle}>
            {GENERAL_LEGAL_DOC_LABELS.sectionTitle}
          </h2>
          <ul className={styles.relatedList}>
            <li>
              <a href={GENERAL_LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer">
                Privacy & cookie policy
              </a>
            </li>
            <li>
              <a href={GENERAL_LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer">
                Terms of use
              </a>
            </li>
            <li>
              <a href={GENERAL_LEGAL_LINKS.dpa} target="_blank" rel="noopener noreferrer">
                Data Processing Agreement (DPA)
              </a>
            </li>
          </ul>
        </section>
      </main>
      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} {LEGAL_COMPANY}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
