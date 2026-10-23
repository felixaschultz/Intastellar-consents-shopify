import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

/**
 * Partner development stores and Shopify Plus sandboxes have no real payment
 * method on file, so Shopify can never settle a non-test charge against
 * them — including when the App Store review team installs the app on one
 * to test billing. Deciding test mode from our own NODE_ENV (as before)
 * can't account for that: the deployed review environment *is* production,
 * so every reviewer subscription attempt tried to create a real charge and
 * failed to complete. Ask Shopify about the shop itself instead.
 */
export async function isTestBillingMode(admin: AdminApiContext): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;

  const response = await admin.graphql(`
    query ShopBillingPlan {
      shop {
        plan {
          partnerDevelopment
        }
      }
    }
  `);
  const { data } = (await response.json()) as {
    data?: { shop?: { plan?: { partnerDevelopment?: boolean } } };
  };

  return Boolean(data?.shop?.plan?.partnerDevelopment);
}
