import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import logo from "../../assets/combined-intastellar-shopify.svg";
import {
  INTASTELLAR_SUPPORT_LINKS,
  PUBLIC_SITE_URL,
  SHOPIFY_APP_META,
} from "../../lib/shopify-app-seo";
import { APP_LEGAL_LINKS } from "../../lib/legal-content";
import { loginErrorMessage } from "./error.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  const url = new URL(request.url);
  const shopFromQuery = url.searchParams.get("shop")?.trim() ?? "";

  return { errors, shopFromQuery };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export const meta = () => [
  { title: `${SHOPIFY_APP_META.title} — Log in` },
  {
    name: "description",
    content:
      "Log in to Intastellar Consents for Shopify. Enter your store domain to open the app in Shopify admin and manage cookie consent.",
  },
  { name: "robots", content: "index, follow" },
  { tagName: "link", rel: "canonical", href: `${PUBLIC_SITE_URL}auth/login` },
];

export default function AuthLoginPage() {
  const { errors, shopFromQuery } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState(shopFromQuery);
  const fieldErrors = actionData?.errors ?? errors;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.homeLink}>
          ← Back to home
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <Link to="/" className={styles.logoLink}>
            <img
              src={logo}
              alt="Intastellar Consents for Shopify"
              className={styles.logoImage}
            />
          </Link>

          <h1 className={styles.title}>Log in</h1>
          <p className={styles.lead}>
            Enter your Shopify store domain to open Intastellar Consents in your
            admin and manage your cookie consent banner.
          </p>

          <Form className={styles.form} method="post" action="/auth/login">
            <div>
              <label className={styles.fieldLabel} htmlFor="shop">
                Shop domain
              </label>
              <input
                id="shop"
                className={`${styles.input}${fieldErrors.shop ? ` ${styles.inputError}` : ""}`}
                type="text"
                name="shop"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                autoComplete="url"
                placeholder="your-store.myshopify.com"
                aria-invalid={fieldErrors.shop ? "true" : "false"}
                aria-describedby={fieldErrors.shop ? "shop-error" : "shop-help"}
                required
              />
              {fieldErrors.shop ? (
                <p id="shop-error" className={styles.fieldError} role="alert">
                  {fieldErrors.shop}
                </p>
              ) : (
                <p id="shop-help" className={styles.fieldHelp}>
                  Use your .myshopify.com address or a custom domain connected to
                  your store.
                </p>
              )}
            </div>

            <button className={styles.submit} type="submit">
              Continue with Shopify
            </button>
          </Form>

          <div className={styles.divider} aria-hidden="true">
            or
          </div>

          <nav className={styles.secondaryLinks} aria-label="Related links">
            <Link to="/">New to Intastellar Consents? View the landing page</Link>
          </nav>
        </div>
      </main>

      <footer className={styles.footer}>
        <nav className={styles.footerLinks} aria-label="Site links">
          <Link to={APP_LEGAL_LINKS.privacy}>App Privacy</Link>
          <Link to={APP_LEGAL_LINKS.terms}>App Terms</Link>
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
          <a
            href="https://www.intastellarsolutions.com/about/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            General Privacy
          </a>
        </nav>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} Intastellar Solutions, International
        </p>
      </footer>
    </div>
  );
}
