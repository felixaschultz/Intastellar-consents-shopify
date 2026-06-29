import type { MetaFunction } from "@remix-run/node";
import { LegalDocumentLayout } from "../components/LegalDocumentLayout";
import {
  APP_LEGAL_LINKS,
  APP_NAME,
  LEGAL_COMPANY,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
} from "../lib/legal-content";

export const meta: MetaFunction = () => [
  {
    title: `App Terms of Use — ${APP_NAME} for Shopify`,
  },
  {
    name: "description",
    content: `Terms of use for the ${APP_NAME} Shopify app: installation, free banner, merchant responsibilities, and relationship to the Intastellar Consents Platform.`,
  },
  { name: "robots", content: "index, follow" },
  { tagName: "link", rel: "canonical", href: "/legal/terms" },
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

export default function AppTermsPage() {
  return (
    <LegalDocumentLayout
      title={`${APP_NAME} — App Terms of Use`}
      docLabel="App terms"
      relatedLinks={[
        {
          href: APP_LEGAL_LINKS.privacy,
          label: `${APP_NAME} — App Privacy Policy`,
        },
        { href: APP_LEGAL_LINKS.hub, label: "All app legal documents" },
      ]}
    >
      <h2>1. Agreement</h2>
      <p>
        These App Terms of Use (&quot;App Terms&quot;) govern your access to and
        use of the {APP_NAME} application for Shopify (the &quot;App&quot;)
        provided by {LEGAL_COMPANY}. By installing, accessing, or using the App,
        you agree to these App Terms.
      </p>
      <p>
        These App Terms are <strong>supplemental</strong> to {LEGAL_COMPANY}&apos;s{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          general Terms of use
        </a>
        ,{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy &amp; cookie policy
        </a>
        , and, where applicable, the{" "}
        <a
          href="https://www.intastellarsolutions.com/about/legal/dpa"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data Processing Agreement (DPA)
        </a>
        . If there is a conflict between these App Terms and the general terms
        regarding the App specifically, these App Terms prevail for the App only.
      </p>

      <h2>2. The service</h2>
      <p>The App enables Shopify merchants to:</p>
      <ul>
        <li>
          Configure an Intastellar Consents cookie consent banner for their storefront
        </li>
        <li>
          Store banner settings on the Shopify app installation and expose them
          to the theme app embed
        </li>
        <li>
          Align with Shopify&apos;s Customer Privacy API as part of the integration
        </li>
        <li>
          Optionally connect to the Intastellar Consents Platform for analytics
          and reporting (separate account and plan terms may apply)
        </li>
      </ul>
      <p>
        The <strong>storefront cookie banner</strong> is offered free for use on
        Shopify stores through this App unless otherwise stated in the Shopify App
        Store listing or a separate agreement. Paid Platform features are subject
        to Intastellar Accounts and Intastellar Consents Platform subscription terms.
      </p>

      <h2>3. Shopify relationship</h2>
      <p>
        The App is built for Shopify and requires a valid Shopify store. Your use
        of Shopify is governed by Shopify&apos;s terms and policies. {LEGAL_COMPANY}
        is not Shopify; we are an independent third-party app developer. Shopify
        may remove, suspend, or modify App access in accordance with Shopify
        policies.
      </p>
      <p>
        You authorise the App to access your store via Shopify OAuth within the
        scopes requested at install (currently including read access to checkout
        branding, files, and themes to support banner setup). You can uninstall
        the App at any time from Shopify admin.
      </p>

      <h2>4. Merchant responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>
          Ensuring your use of cookie consent and tracking on your store complies
          with applicable laws (including GDPR, ePrivacy, CCPA/CPRA, and others
          relevant to your visitors)
        </li>
        <li>
          Providing accurate privacy policy links and truthful information to
          visitors through your banner configuration
        </li>
        <li>
          Enabling the Intastellar Consents app embed in your theme after
          configuration
        </li>
        <li>
          Maintaining the security of your Shopify admin and staff accounts
        </li>
        <li>
          Tags, analytics, and marketing tools you connect beyond what the App
          configures directly
        </li>
      </ul>
      <p>
        The App provides consent management tooling; it does not by itself make
        your entire business compliant. You remain responsible for your overall
        compliance programme.
      </p>

      <h2>5. Demo stores and Intastellar Accounts</h2>
      <p>
        If you sign up for a free demo, you may receive a Shopify development
        store and communications about install status. By submitting the demo
        form, you agree that we may register your email with Intastellar Accounts
        to support future access to the Intastellar Consents Platform, as
        described on the form and in the{" "}
        <a href={APP_LEGAL_LINKS.privacy}>App Privacy Policy</a>.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Use the App in violation of law or third-party rights</li>
        <li>Attempt to bypass security, scrape, or reverse engineer the App</li>
        <li>
          Use the App to distribute malware or misleading consent interfaces
        </li>
        <li>Resell or sublicense the App except as permitted by {LEGAL_COMPANY}</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        {LEGAL_COMPANY} retains all rights in the App, Intastellar Consents software,
        documentation, and branding. You receive a limited, non-exclusive,
        revocable licence to use the App for your Shopify store while installed
        and in compliance with these App Terms.
      </p>

      <h2>8. Availability and changes</h2>
      <p>
        We aim to keep the App available and maintained but do not guarantee
        uninterrupted operation. We may update the App, change features, or
        discontinue parts of the service with reasonable notice where practicable.
        Configuration is stored on your Shopify installation; uninstalling removes
        the App&apos;s active integration from your theme when embeds are
        disabled.
      </p>

      <h2>9. Disclaimer</h2>
      <p>
        The App is provided &quot;as is&quot; to the extent permitted by law.
        {LEGAL_COMPANY} disclaims warranties not required by mandatory law. We do not
        warrant that the App will meet every merchant&apos;s specific legal or
        technical requirements without appropriate configuration and legal advice.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, {LEGAL_COMPANY}&apos;s
        aggregate liability arising from or related to the App is limited as set
        out in the general Terms of use, except where mandatory law provides
        otherwise. Nothing in these App Terms limits liability for fraud, gross
        negligence, or death or personal injury caused by negligence where such
        limitation is prohibited.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using the App by uninstalling it from Shopify. We may suspend
        or terminate access if you materially breach these App Terms or if required
        for security or legal reasons. Provisions that by nature should survive
        termination (including intellectual property, disclaimers, and liability
        limits) continue to apply.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these App Terms:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>

      <p>
        <em>
          Last reviewed {LEGAL_LAST_UPDATED}. Please also read {LEGAL_COMPANY}&apos;s
          general legal documents linked below.
        </em>
      </p>
    </LegalDocumentLayout>
  );
}
