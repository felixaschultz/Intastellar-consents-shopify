import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";

type LandingHeadHandle = {
  googleTagManagerId?: string;
  jsonLdSchema?: Record<string, unknown>;
  /** Inline `window.INTA` for the marketing landing page only (not embedded /app). */
  intaConfig?: Record<string, unknown>;
  headScripts?: { src: string; async?: boolean; defer?: boolean }[];
};

function sanitizeGtmContainerId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const id = raw.trim();
  return /^GTM-[A-Z0-9]+$/i.test(id) ? id.toUpperCase() : undefined;
}

function useLandingHandle(): LandingHeadHandle | undefined {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as LandingHeadHandle | undefined;
    if (
      handle?.googleTagManagerId ||
      handle?.jsonLdSchema ||
      handle?.intaConfig ||
      handle?.headScripts?.length
    ) {
      return handle;
    }
  }
  return undefined;
}

export default function App() {
  const landing = useLandingHandle();
  const gtmId = sanitizeGtmContainerId(landing?.googleTagManagerId);
  const jsonLdSchema = landing?.jsonLdSchema;
  const intaConfig = landing?.intaConfig;
  const headScripts = landing?.headScripts ?? [];

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
        {intaConfig ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.INTA=${JSON.stringify(intaConfig).replace(/</g, "\\u003c")};`,
            }}
          />
        ) : null}
        {headScripts.map((script) => (
          <script
            key={script.src}
            src={script.src}
            async={script.async}
            defer={script.defer}
          />
        ))}
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
