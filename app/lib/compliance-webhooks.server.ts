import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Mandatory GDPR webhooks — HMAC verified via authenticate.webhook().
 * @see https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */
export async function handleCustomersDataRequest({
  request,
}: ActionFunctionArgs) {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} for ${shop}`, payload);
  // No customer PII stored; banner config lives on app installation metafields.
  return new Response(null, { status: 200 });
}

export async function handleCustomersRedact({ request }: ActionFunctionArgs) {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} for ${shop}`, payload);
  // No customer PII stored by this app.
  return new Response(null, { status: 200 });
}

export async function handleShopRedact({ request }: ActionFunctionArgs) {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} for ${shop}`, payload);
  await db.session.deleteMany({ where: { shop } });
  return new Response(null, { status: 200 });
}
