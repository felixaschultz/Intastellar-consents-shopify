/**
 * Theme app embed deep link — handle must match the Liquid block filename (without .liquid).
 * @see extensions/intastellar-consents-banner/blocks/intastellar-consents.liquid
 * @see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#app-embed-block-deep-linking
 */
export const THEME_APP_EMBED_BLOCK_HANDLE = "intastellar-consents";

export function buildThemeEditorAppEmbedUrl(
  myshopifyDomain: string,
  apiKey: string | undefined,
): string | null {
  const key = apiKey?.trim();
  if (!key) return null;
  const params = new URLSearchParams({
    context: "apps",
    template: "index",
    activateAppId: `${key}/${THEME_APP_EMBED_BLOCK_HANDLE}`,
  });
  return `https://${myshopifyDomain}/admin/themes/current/editor?${params.toString()}`;
}
