import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { LegalDocumentLayout } from "../components/LegalDocumentLayout";
import {
  APP_LEGAL_LINKS,
  APP_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
} from "../lib/legal-content";

export const meta: MetaFunction = () => [
  {
    title: `App Privacy Policy — ${APP_NAME} for Shopify`,
  },
  {
    name: "description",
    content: `Privacy policy for the ${APP_NAME} Shopify app: data collected in admin, demo signup, storefront consent, and Shopify compliance webhooks.`,
  },
  { name: "robots", content: "index, follow" },
  { tagName: "link", rel: "canonical", href: "/legal/privacy" },
];

export default function AppPrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title={`${APP_NAME} — App Privacy Policy`}
      docLabel="App privacy"
      relatedLinks={[
        {
          href: APP_LEGAL_LINKS.terms,
          label: `${APP_NAME} — App Terms of Use`,
        },
        { href: APP_LEGAL_LINKS.hub, label: "All app legal documents" },
      ]}
    >
      <h2>1. Who this applies to</h2>
      <p>
        This App Privacy Policy describes how Intastellar Solutions,
        International (&quot;Intastellar&quot;, &quot;we&quot;, &quot;us&quot;)
        processes personal data when you use the {APP_NAME} application for
        Shopify merchants (the &quot;App&quot;), including our public landing
        page, OAuth install flow, embedded Shopify admin, and related services
        at <code>consentsplatform.com</code> and{" "}
        <code>app.consentsmanagement.com</code>.
      </p>
      <p>
        For how Intastellar processes data across its websites, consent platform,
        accounts, and other products, see the{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          general Privacy &amp; cookie policy
        </a>
        . Where storefront visitors interact with your cookie banner, the{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/dpa"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data Processing Agreement (DPA)
        </a>{" "}
        describes processor obligations for consent-related processing.
      </p>

      <h2>2. Roles: merchant, Intastellar, and Shopify</h2>
      <ul>
        <li>
          <strong>You (the merchant)</strong> are typically the data controller
          for personal data relating to your storefront visitors and customers,
          including cookie/consent choices on your shop.
        </li>
        <li>
          <strong>Intastellar</strong> provides the App and, when the banner is
          enabled, consent management technology. For consent logs and banner
          analytics, Intastellar generally acts as a processor on your
          instructions — see the general DPA.
        </li>
        <li>
          <strong>Shopify</strong> hosts your store and provides the Customer
          Privacy API and admin tools. Shopify&apos;s own privacy terms apply to
          Shopify&apos;s processing.
        </li>
      </ul>

      <h2>3. Data we process through the App</h2>
      <p>
        The App is designed to store <strong>merchant configuration</strong> and{" "}
        <strong>minimal operational data</strong> needed to run the integration.
        We do not use the App database to store your customers&apos; consent
        records as identifiable end-user profiles.
      </p>

      <h3>3.1 Shopify admin / install (merchants & staff)</h3>
      <p>When you install or use the App in Shopify admin, we may process:</p>
      <ul>
        <li>Shop domain and shop name</li>
        <li>
          OAuth session data (access tokens and related session metadata required
          to operate the App)
        </li>
        <li>
          Optional Shopify staff profile fields exposed during OAuth (such as
          name, email, locale) when available from Shopify
        </li>
        <li>
          Banner configuration you save in the App (for example company name,
          colours, policy URL, cookie categories, language, and related{" "}
          <code>window.INTA</code> settings), stored as app installation
          metafields on Shopify
        </li>
        <li>
          Theme/branding assets we read via Shopify Admin API scopes to help
          pre-fill logo or brand colour (checkout branding, theme files) —
          scopes: <code>read_checkout_branding_settings</code>,{" "}
          <code>read_files</code>, <code>read_themes</code>
        </li>
      </ul>

      <h3>3.2 Demo / pilot signup (landing page)</h3>
      <p>If you request a free demo store from our landing page, we collect:</p>
      <ul>
        <li>Work email address</li>
        <li>Requested store name</li>
        <li>Information about your current cookie banner (CMP)</li>
        <li>Provisioning status and associated Shopify development store domain</li>
      </ul>
      <p>
        With your consent as described on the form, we may also register your
        email with <strong>Intastellar Accounts</strong> (
        <code>intastellaraccounts.com</code>) so you can access the Intastellar
        Consents Platform later. That account system is governed by the general
        Intastellar privacy policy and account terms in addition to this
        document.
      </p>

      <h3>3.3 Storefront visitors (your customers)</h3>
      <p>
        When you enable the theme app embed, Intastellar&apos;s consent script (
        <code>uc.js</code>) loads on your storefront. Consent decisions and
        related technical metadata are handled under Intastellar&apos;s consent
        platform rules described in the general privacy policy (including EU/EEA
        storage of consent logs). The App itself does not persist customer PII in
        our application database.
      </p>
      <p>
        We respond to Shopify mandatory compliance webhooks (
        <code>customers/data_request</code>, <code>customers/redact</code>,{" "}
        <code>shop/redact</code>). For customer data requests and redactions
        relating to data stored by this App&apos;s backend, we generally have no
        customer-level records to export; banner configuration is removed when
        the app is uninstalled or upon shop redaction as applicable.
      </p>

      <h2>4. Purposes and legal bases (GDPR)</h2>
      <ul>
        <li>
          <strong>Provide the App</strong> — install, authenticate, save
          settings, inject configuration to your theme (contract / legitimate
          interest).
        </li>
        <li>
          <strong>Demo provisioning</strong> — create development stores and
          contact you about readiness (contract / consent where required).
        </li>
        <li>
          <strong>Security &amp; compliance</strong> — operate webhooks, prevent
          abuse, meet legal obligations (legitimate interest / legal obligation).
        </li>
        <li>
          <strong>Improve the product</strong> — aggregated, non-customer
          operational logs (legitimate interest).
        </li>
      </ul>

      <h2>5. Recipients and subprocessors</h2>
      <p>We use service providers necessary to operate the App, including:</p>
      <ul>
        <li>
          <strong>Shopify</strong> — commerce platform, OAuth, APIs, webhooks
        </li>
        <li>
          <strong>Vercel</strong> — application hosting for{" "}
          <code>consentsplatform.com</code> and{" "}
          <code>app.consentsmanagement.com</code>
        </li>
        <li>
          <strong>Database hosting</strong> — session and pilot-lead storage
          (PostgreSQL as configured for this app)
        </li>
        <li>
          <strong>Intastellar CDN</strong> — delivery of{" "}
          <code>uc.js</code> and consent services
        </li>
        <li>
          <strong>Intastellar Accounts</strong> — optional account registration
          from demo signup
        </li>
      </ul>
      <p>
        International transfers, where applicable, are handled under safeguards
        described in the{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          general privacy policy
        </a>
        .
      </p>

      <h2>6. Retention</h2>
      <ul>
        <li>
          <strong>OAuth sessions</strong> — until uninstall, expiry, or shop
          redaction webhook processing
        </li>
        <li>
          <strong>Pilot / demo leads</strong> — for operational and support
          purposes, then deleted or anonymised according to internal retention
          schedules
        </li>
        <li>
          <strong>Banner configuration</strong> — stored on Shopify app
          installation metafields until you delete them or uninstall the App
        </li>
        <li>
          <strong>Consent logs</strong> — retention per general Intastellar
          consent platform policy and your Platform plan
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        Depending on applicable law, you may have rights of access, rectification,
        erasure, restriction, portability, and objection. Merchants can contact us
        at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        Storefront visitors should contact you as controller in the first
        instance; we assist merchants as processor where applicable under the DPA.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this App Privacy Policy from time to time. The &quot;Last
        updated&quot; date at the top indicates the current version. Material
        changes may be communicated through the App or by email where
        appropriate.
      </p>

      <p>
        <em>
          This document was last reviewed on {LEGAL_LAST_UPDATED}. It is not
          legal advice; merchants should ensure their own compliance programme
          meets applicable laws.
        </em>
      </p>
    </LegalDocumentLayout>
  );
}
