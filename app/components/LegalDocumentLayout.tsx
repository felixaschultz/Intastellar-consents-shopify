import { Link } from "@remix-run/react";
import type { ReactNode } from "react";
import {
  APP_NAME,
  GENERAL_LEGAL_LINKS,
  LEGAL_COMPANY,
  LEGAL_LAST_UPDATED,
} from "../lib/legal-content";
import styles from "../routes/legal/styles.module.css";

type Props = {
  title: string;
  docLabel: string;
  children: ReactNode;
  relatedLinks?: { href: string; label: string; external?: boolean }[];
};

export function LegalDocumentLayout({
  title,
  docLabel,
  children,
  relatedLinks = [],
}: Props) {
  const defaultRelated = [
    {
      href: GENERAL_LEGAL_LINKS.privacy,
      label: "Intastellar general Privacy & cookie policy",
      external: true,
    },
    {
      href: GENERAL_LEGAL_LINKS.terms,
      label: "Intastellar general Terms of use",
      external: true,
    },
    {
      href: GENERAL_LEGAL_LINKS.dpa,
      label: "Intastellar Data Processing Agreement (DPA)",
      external: true,
    },
  ];

  const allRelated = [...relatedLinks, ...defaultRelated];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.homeLink}>
            ← {APP_NAME} for Shopify
          </Link>
          <span className={styles.docType}>{docLabel}</span>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>
          Last updated {LEGAL_LAST_UPDATED} · {LEGAL_COMPANY}
        </p>
        <div className={styles.notice}>
          <strong>Supplemental document.</strong> This policy applies specifically
          to the {APP_NAME} Shopify app at{" "}
          <code>app.consentsmanagement.com</code>. It supplements — and does not
          replace — Intastellar&apos;s general legal documents linked at the bottom
          of this page.
        </div>
        <article className={styles.prose}>{children}</article>
        {allRelated.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-legal">
            <h2 id="related-legal" className={styles.relatedTitle}>
              Related legal documents
            </h2>
            <ul className={styles.relatedList}>
              {allRelated.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <footer className={styles.footer}>
        <nav className={styles.footerLinks} aria-label="Legal">
          <Link to="/legal/privacy">App privacy</Link>
          <span className={styles.footerDivider} aria-hidden="true">
            ·
          </span>
          <Link to="/legal/terms">App terms</Link>
          <span className={styles.footerDivider} aria-hidden="true">
            ·
          </span>
          <a href={GENERAL_LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer">
            General privacy
          </a>
          <span className={styles.footerDivider} aria-hidden="true">
            ·
          </span>
          <a href={GENERAL_LEGAL_LINKS.dpa} target="_blank" rel="noopener noreferrer">
            DPA
          </a>
        </nav>
        <p>
          &copy; {new Date().getFullYear()} {LEGAL_COMPANY}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
