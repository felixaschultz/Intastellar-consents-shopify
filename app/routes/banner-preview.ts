import {
  publicSiteBase,
  shopifyAppServerBase,
} from "../lib/shopify-app-seo";

/**
 * Live banner preview for the embedded admin (app._index.tsx).
 *
 * uc.js does ~2.5s of main-thread work when it starts (and more while it
 * runs). Inside a same-origin srcDoc iframe that work blocked the admin page
 * itself, which pushed out LCP and made typing in the settings form lag
 * (INP). The admin now frames this page from PUBLIC_SITE_URL instead, a
 * different site from SHOPIFY_APP_URL, so the browser runs it in its own
 * process. uc.js needs a real origin (cookies / localStorage), which is why
 * a sandboxed iframe without allow-same-origin isn't an option.
 *
 * The banner config travels in the URL fragment, so it never reaches the
 * server; a new fragment reloads the page with the new config.
 */
const UC_JS_URL =
  "https://consents.cdn.intastellarsolutions.com/uc.js?utm_source=shopify&utm_medium=app&utm_campaign=shopify_app";

const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Banner preview</title>
<script>
try { window.INTA = JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
addEventListener("hashchange", function () { location.reload(); });
</script>
<script src="${UC_JS_URL}"></script>
</head><body style="margin:0;background:#f1f1f1;min-height:360px;"></body></html>`;

export const loader = async () => {
  const ancestors = new Set([
    "'self'",
    "https://admin.shopify.com",
    "https://*.myshopify.com",
    shopifyAppServerBase(),
    publicSiteBase(),
  ]);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `frame-ancestors ${[...ancestors].join(" ")};`,
      "Cache-Control": "public, max-age=300",
    },
  });
};
