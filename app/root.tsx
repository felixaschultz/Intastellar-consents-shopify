import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";

type GtmHandle = {
  googleTagManagerId?: string;
  jsonLdSchema?: Record<string, unknown>;
};

function sanitizeGtmContainerId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const id = raw.trim();
  return /^GTM-[A-Z0-9]+$/i.test(id) ? id.toUpperCase() : undefined;
}

function useLandingGtmContainerId(): string | undefined {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const id = sanitizeGtmContainerId(
      (matches[i].handle as GtmHandle | undefined)?.googleTagManagerId,
    );
    if (id) return id;
  }
  return undefined;
}

function useLandingJsonLdSchema(): Record<string, unknown> | undefined {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const schema = (matches[i].handle as GtmHandle | undefined)?.jsonLdSchema;
    if (schema && typeof schema === "object") return schema;
  }
  return undefined;
}

export default function App() {
  const gtmId = useLandingGtmContainerId();
  const jsonLdSchema = useLandingJsonLdSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          window.INTA = {
            "policy_link": {
              "link": "https://www.intastellarsolutions.com/about/legal/privacy",
              "target": "_blank",
            },
            "settings": {
              "rootDomain": "consentsplatform.com",
              "company": "Intastellar Solutions International",
              color: "rgb(163, 133, 64)",
              language: "auto",
              gtagId: "G-86T4LDB766",
              arrange: "rtl",
              design: "bannerV2",
              "requiredCookies": [],
              "keepInLocalStorage": [],
              logo: "/assets/combined-intastellar-shopify-Ddl8uPI-.svg",
            }
          }
        `}}></script>
        <script src="https://consents.cdn.intastellarsolutions.com/uc.js"></script>
        {gtmId ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" />
        ) : null}
        <Meta />
        <Links />
        {jsonLdSchema ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLdSchema).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}
        {gtmId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        ) : null}
      </head>
      <body suppressHydrationWarning>
        {gtmId ? (
          <noscript
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe>`,
            }}
          />
        ) : null}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
