import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { syncConsentsPlatformAccess } from "../lib/consents-platform-billing.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const subscription = payload.app_subscription as
    | { name?: string; status?: string }
    | undefined;

  if (subscription?.status) {
    await syncConsentsPlatformAccess({
      shop,
      plan: subscription.status === "ACTIVE" ? subscription.name ?? null : null,
      status: subscription.status as
        | "ACTIVE"
        | "CANCELLED"
        | "PENDING"
        | "DECLINED"
        | "EXPIRED"
        | "FROZEN"
        | "ACCEPTED",
    });
  }

  return new Response(null, { status: 200 });
};
