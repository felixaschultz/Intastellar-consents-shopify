import type { LoaderFunctionArgs } from "@remix-run/node";
import crypto from "node:crypto";
import { unauthenticated } from "../shopify.server";

/**
 * Server-to-server endpoint for intastellarconsents.com (a separate
 * codebase) to check whether a Shopify store has an active Consents
 * Platform subscription. Not a Shopify-authenticated route — callers
 * authenticate with a shared secret instead.
 *
 * GET /api/billing-status?shop=example.myshopify.com
 * Header: Authorization: Bearer <CONSENTS_PLATFORM_API_SECRET>
 */

const MYSHOPIFY_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

function isAuthorized(request: Request): boolean {
  const expected = process.env.CONSENTS_PLATFORM_API_SECRET;
  if (!expected) return false;

  const provided = (request.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

interface ActiveSubscription {
  id: string;
  name: string;
  status: string;
  test: boolean;
  currentPeriodEnd: string | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const shop = new URL(request.url).searchParams.get("shop")?.trim().toLowerCase() ?? "";
  if (!MYSHOPIFY_DOMAIN_RE.test(shop)) {
    return Response.json({ error: "invalid_shop" }, { status: 400 });
  }

  let admin;
  try {
    ({ admin } = await unauthenticated.admin(shop));
  } catch {
    // No stored session: the shop never installed the app, or uninstalled it.
    return Response.json({ error: "not_installed", shop }, { status: 404 });
  }

  const response = await admin.graphql(`
    query ActiveSubscriptions {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          currentPeriodEnd
        }
      }
    }
  `);
  const { data } = (await response.json()) as {
    data?: { currentAppInstallation?: { activeSubscriptions: ActiveSubscription[] } };
  };
  const subscriptions = data?.currentAppInstallation?.activeSubscriptions ?? [];
  const active = subscriptions.find((s) => s.status === "ACTIVE") ?? null;

  return Response.json({
    shop,
    subscribed: Boolean(active),
    plan: active?.name ?? null,
    status: active?.status ?? null,
    test: active?.test ?? null,
    currentPeriodEnd: active?.currentPeriodEnd ?? null,
  });
}
