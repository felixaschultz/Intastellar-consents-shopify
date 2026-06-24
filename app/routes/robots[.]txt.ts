import { publicSiteBase } from "../lib/shopify-app-seo";

export const loader = () => {
  const sitemapOrigin = publicSiteBase();
  const body = `User-agent: *
Allow: /
Allow: /legal/
Allow: /auth/login

Sitemap: ${sitemapOrigin}/sitemap.xml

# AI / LLM site summary
# ${sitemapOrigin}/llm.txt
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
