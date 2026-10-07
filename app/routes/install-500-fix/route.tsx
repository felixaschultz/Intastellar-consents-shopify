import type { MetaFunction, LinksFunction } from "@remix-run/node";
import styles from "./styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Install 500 — Resolved | Intastellar Consents" },
  { name: "robots", content: "noindex, nofollow" },
];

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
  },
];

export default function InstallFixProof() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <span className={styles.eyebrow}>Shopify App Review &middot; Requirement 2.1.1</span>
        <h1 className={styles.title}>Embedded app no longer 500s on install</h1>
        <p className={styles.lede}>
          After installation and after an authorized reinstall, <code>/app</code> returned
          HTTP 500 with &ldquo;Something went wrong.&rdquo; Root cause and fix verified
          against production below, with a screen recording of the app loading successfully
          post-fix.
        </p>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Before &rarr; After</p>
          <div className={styles.statusRow}>
            <div className={`${styles.statusCard} ${styles.before}`}>
              <p className={styles.label}>GET /app &mdash; install / reinstall</p>
              <p className={styles.statusCode}>
                500 <span className={styles.tag}>Error</span>
              </p>
              <p className={styles.detail}>
                &ldquo;Something went wrong&rdquo; &mdash; MissingSessionTableError
              </p>
            </div>
            <span className={styles.arrow}>&rarr;</span>
            <div className={`${styles.statusCard} ${styles.after}`}>
              <p className={styles.label}>GET /app &mdash; same store, reinstalled</p>
              <p className={styles.statusCode}>
                200 <span className={styles.tag}>OK</span>
              </p>
              <p className={styles.detail}>Banner settings load normally</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Screen recording</p>
          <video className={styles.video} controls preload="metadata">
            <source src="/proof/install-500-fix.mp4" type="video/mp4" />
          </video>
          <p className={styles.videoCaption}>
            Reinstalling the app and opening the embedded <code>/app</code> settings page in
            Shopify admin.
          </p>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Root cause &amp; fix</p>
          <div className={styles.timeline}>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Cause</span>
              <span className={styles.what}>
                Production database was missing its Prisma <code>Session</code> table, so
                every call to <code>authenticate.admin()</code> threw on <code>/app</code> and
                on the <code>app/uninstalled</code> webhook.
              </span>
              <span className={`${styles.pill} ${styles.pillFail}`}>500</span>
            </div>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Fix</span>
              <span className={styles.what}>
                Redeployed on Vercel so the build&rsquo;s <code>prisma migrate deploy</code>{" "}
                step ran against the live database and created the missing table.
              </span>
              <span className={`${styles.pill} ${styles.pillOk}`}>deployed</span>
            </div>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Verified</span>
              <span className={styles.what}>
                Reinstalled the app on the test store; <code>/app</code> authenticated and
                rendered the settings page with a newly created session, no errors.
              </span>
              <span className={`${styles.pill} ${styles.pillOk}`}>200</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Production log &mdash; captured via Vercel CLI</p>
          <div className={styles.log}>
            {"17:27:59.82 "}
            <span className={styles.logKey}>GET /app</span>
            {" "}
            <span className={styles.logMuted}>{"→ 200"}</span>
            {"\n[shopify-app/INFO] Authenticating admin request | {shop: nordic-home-9103.myshopify.com}\n[shopify-app/INFO] No valid session found | {shop: nordic-home-9103.myshopify.com}\n[shopify-app/INFO] Requesting offline access token | {shop: nordic-home-9103.myshopify.com}\n[shopify-api/INFO] Creating new session | {shop: nordic-home-9103.myshopify.com, isOnline: false}\n"}
            <span className={styles.logMuted}>
              — no MissingSessionTableError, no ErrorBoundary entries after this deploy —
            </span>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Intastellar Consents &middot; Shopify App</span>
          <span>app.consentsmanagement.com</span>
        </footer>
      </main>
    </div>
  );
}
