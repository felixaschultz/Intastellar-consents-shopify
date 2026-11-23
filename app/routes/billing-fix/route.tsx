import type { MetaFunction, LinksFunction } from "@remix-run/node";
import { useRef } from "react";
import styles from "../install-500-fix/styles.module.css";

export const meta: MetaFunction = () => [
  { title: "Billing Flow — Resolved | Intastellar Consents" },
  { name: "robots", content: "noindex, nofollow" },
];

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
  },
];

/** Seconds into /proof/billing-fix.mp4 where each step of the flow starts. */
const CHAPTERS = [
  { at: 0, time: "0:00", what: "Uninstall: the app is removed in Settings → Apps." },
  { at: 10, time: "0:10", what: "Reinstall: the merchant installs the app again." },
  { at: 15, time: "0:15", what: "The app opens on Banner settings — the banner app is free to use." },
  { at: 40, time: "0:40", what: "Plans & billing: View plans opens Shopify's hosted plan page." },
  { at: 47, time: "0:47", what: "Decline: choose Starter, then Cancel on Shopify's approval screen. Nothing is charged." },
  { at: 58, time: "0:58", what: "Accept: choose Growth and approve it (test charge on a development store)." },
  { at: 70, time: "1:10", what: "The merchant returns to the app inside Shopify admin." },
  { at: 78, time: "1:18", what: "Plans & billing shows the Growth plan and the dashboard link." },
  { at: 85, time: "1:25", what: "Change plan: switch back to Free, then return to the app." },
];

export default function BillingFixProof() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const jumpTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play().catch(() => {});
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <span className={styles.eyebrow}>Shopify App Review &middot; Requirement 1.2.2</span>
        <h1 className={styles.title}>Billing now completes end to end</h1>
        <p className={styles.lede}>
          The subscribe flow could start but never finished. Intastellar Consents now uses
          Shopify App Pricing: merchants accept, decline, change and cancel plans on
          Shopify&rsquo;s own plan page, including after a reinstall, then return to the app
          with their plan applied. The
          cookie banner app itself stays free; paid plans are optional and unlock the hosted
          Intastellar Consents Platform.
        </p>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Before &rarr; After</p>
          <div className={styles.statusRow}>
            <div className={`${styles.statusCard} ${styles.before}`}>
              <p className={styles.label}>Subscribe &mdash; appSubscriptionCreate</p>
              <p className={styles.statusCode}>
                Failed <span className={styles.tag}>Error</span>
              </p>
              <p className={styles.detail}>
                &ldquo;Cannot use the Billing API (to create charges) when on Shopify App
                Pricing.&rdquo;
              </p>
            </div>
            <span className={styles.arrow}>&rarr;</span>
            <div className={`${styles.statusCard} ${styles.after}`}>
              <p className={styles.label}>Subscribe &mdash; Shopify hosted plan page</p>
              <p className={styles.statusCode}>
                Approved <span className={styles.tag}>OK</span>
              </p>
              <p className={styles.detail}>Merchant returns to the app with the plan shown</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Screen recording</p>
          <video
            ref={videoRef}
            className={styles.video}
            controls
            playsInline
            preload="metadata"
            poster="/proof/billing-fix-poster.jpg"
          >
            <source src="/proof/billing-fix.mp4" type="video/mp4" />
          </video>
          <p className={styles.videoCaption}>
            Recorded on a development store (nordic-home-9103), so every plan is a test charge.
            Click a step below to jump to it.
          </p>
          <div className={styles.timeline}>
            {CHAPTERS.map((chapter, index) => (
              <button
                key={chapter.at}
                type="button"
                className={styles.timelineRow}
                onClick={() => jumpTo(chapter.at)}
                // Reset button chrome but keep the row's top divider from .timelineRow + .timelineRow.
                style={{ font: "inherit", color: "inherit", textAlign: "left", background: "none", borderLeft: 0, borderRight: 0, borderBottom: 0, ...(index === 0 ? { borderTop: 0 } : {}), width: "100%", cursor: "pointer" }}
              >
                <span className={styles.t}>{chapter.time}</span>
                <span className={styles.what}>{chapter.what}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Root cause &amp; fix</p>
          <div className={styles.timeline}>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Cause</span>
              <span className={styles.what}>
                The app is set to Shopify App Pricing in the Partner Dashboard, but its code
                still created charges itself through the Billing API. Shopify rejects that
                combination, so the confirmation step never completed.
              </span>
              <span className={`${styles.pill} ${styles.pillFail}`}>rejected</span>
            </div>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Fix</span>
              <span className={styles.what}>
                Plans &amp; billing now links to Shopify&rsquo;s hosted plan page, which handles
                approval, decline, plan changes, cancellation and re-approval on reinstall.
                After approval the merchant lands back inside the Shopify admin. Development
                stores always get test charges.
              </span>
              <span className={`${styles.pill} ${styles.pillOk}`}>deployed</span>
            </div>
            <div className={styles.timelineRow}>
              <span className={styles.t}>Verified</span>
              <span className={styles.what}>
                On the test store in the recording above: reinstalled the app, declined a paid
                plan, approved another, returned to the app with the plan shown, then switched
                back to Free.
              </span>
              <span className={`${styles.pill} ${styles.pillOk}`}>approved</span>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Intastellar Consents &middot; Shopify App</span>
          <span>consentsplatform.com</span>
        </footer>
      </main>
    </div>
  );
}
