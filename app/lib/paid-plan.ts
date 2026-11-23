/**
 * With Shopify App Pricing, a merchant on the free plan still has an ACTIVE
 * app subscription (named after the free plan in the Partner Dashboard).
 * Only paid plans unlock the Intastellar Consents Platform, so treat the
 * free plan as "no paid plan" everywhere we gate access.
 */
const FREE_PLAN_NAMES = new Set(["free"]);

export function isPaidPlan(name: string | null | undefined): name is string {
  return Boolean(name) && !FREE_PLAN_NAMES.has(name!.trim().toLowerCase());
}
