import type { LoaderFunctionArgs } from "@remix-run/node";
import { SHOPIFY_APP_URL } from "../lib/shopify-app-seo";

const PUBLIC_PATHS = ["/", "/auth/login", "/legal", "/legal/privacy", "/legal/terms"];

export const loader = ({ request }: LoaderFunctionArgs) => {
  const origin = new URL(request.url).origin;
  const base = SHOPIFY_APP_URL.replace(/\/$/, "") || origin;
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = PUBLIC_PATHS.map(
    (path) => `  <url>
    <loc>${base}${path === "/" ? "/" : path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`,
  ).join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
