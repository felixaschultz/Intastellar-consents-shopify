import { publicSiteBase } from "../lib/shopify-app-seo";

const PUBLIC_PATHS = ["/", "/auth/login", "/legal", "/legal/privacy", "/legal/terms", "/shopify-customer-privacy-api"];

export const loader = () => {
  const base = publicSiteBase();
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
