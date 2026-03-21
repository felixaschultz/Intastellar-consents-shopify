import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";

type GtmHandle = { googleTagManagerId?: string };

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

export default function App() {
  const gtmId = useLandingGtmContainerId();

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
        {gtmId ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" />
        ) : null}
        <Meta />
        <Links />
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
          <noscript>
            <iframe
              title="Google Tag Manager"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
