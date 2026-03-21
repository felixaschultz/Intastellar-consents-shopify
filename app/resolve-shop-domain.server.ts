/**
 * Maps a merchant-entered shop value to the permanent *.myshopify.com host.
 * Custom domains (e.g. teeshoppen.dk) redirect to *.myshopify.com when opening /admin.
 */

const MYSHOPIFY_HOST = /\.myshopify\.com$/i;

function shopHostname(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = /^[a-z]+:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    return u.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

function isSafePublicHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".local")) return false;
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname))
    return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  return /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(hostname);
}

async function myshopifyHostFromAdminRedirect(hostname: string): Promise<string | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  const headers = {
    "User-Agent": "IntastellarConsents-ShopifyApp/1.0 (+https://www.intastellarsolutions.com)",
  };
  try {
    const res = await fetch(`https://${hostname}/admin`, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers,
    });

    if (res.status === 405 || res.status === 501) {
      const res2 = await fetch(`https://${hostname}/admin`, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers,
      });
      return locationToMyshopifyHost(res2.headers.get("Location"));
    }

    return locationToMyshopifyHost(res.headers.get("Location"));
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function locationToMyshopifyHost(location: string | null): string | null {
  if (!location) return null;
  try {
    const u = new URL(location, "https://example.com");
    const m = u.hostname.match(/^([a-z0-9-]+)\.myshopify\.com$/i);
    return m ? `${m[1].toLowerCase()}.myshopify.com` : null;
  } catch {
    return null;
  }
}

/**
 * If `raw` is already a myshopify host, or an admin.shopify.com/store/… URL, returns that host.
 * If `raw` looks like a custom storefront domain, follows Shopify’s /admin redirect.
 * Otherwise returns `undefined` and the caller should keep the original input.
 */
export async function resolveShopInputToMyshopifyHost(
  raw: string,
): Promise<string | undefined> {
  const host = shopHostname(raw);
  if (!host) return undefined;

  if (MYSHOPIFY_HOST.test(host)) {
    return host;
  }

  try {
    const u = new URL(raw.includes("://") ? raw.trim() : `https://${raw.trim()}`);
    if (u.hostname === "admin.shopify.com") {
      const m = u.pathname.match(/^\/store\/([^/]+)/);
      if (m) return `${m[1].toLowerCase()}.myshopify.com`;
    }
  } catch {
    /* ignore */
  }

  if (!host.includes(".")) {
    return undefined;
  }

  if (!isSafePublicHostname(host)) {
    return undefined;
  }

  const resolved = await myshopifyHostFromAdminRedirect(host);
  return resolved ?? undefined;
}
