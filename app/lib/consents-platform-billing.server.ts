/**
 * Bridges a Shopify Billing subscription to platform access on
 * intastellarconsents.com. That platform is a separate codebase/deployment
 * not present in this repo, so this is an integration seam, not a working
 * call — wire the actual request (e.g. a signed webhook or API call to
 * intastellarconsents.com granting/revoking the shop's CMP account) in here
 * once that platform exposes an endpoint for it.
 */
export async function syncConsentsPlatformAccess(params: {
  shop: string;
  plan: string | null;
  status: "ACTIVE" | "CANCELLED" | "PENDING" | "DECLINED" | "EXPIRED" | "FROZEN" | "ACCEPTED";
}): Promise<void> {
  console.log("[consents-platform-billing] subscription change", params);
}
