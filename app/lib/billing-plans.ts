/**
 * Plan names/prices for the Intastellar Consents Platform subscription,
 * shared between the server-only billing config (shopify.server.ts) and the
 * client-rendered billing page — kept out of shopify.server.ts itself so
 * referencing these values from route components doesn't pull server-only
 * code into the client bundle.
 */
export const BILLING_PLANS = {
  PERSONAL: "Personal",
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY_PRO: "Agency Pro",
} as const;

export type BillingPlanName = (typeof BILLING_PLANS)[keyof typeof BILLING_PLANS];

export const BILLING_PLAN_PRICES: Record<BillingPlanName, number> = {
  [BILLING_PLANS.PERSONAL]: 5,
  [BILLING_PLANS.STARTER]: 15,
  [BILLING_PLANS.GROWTH]: 30,
  [BILLING_PLANS.AGENCY_PRO]: 79,
};
