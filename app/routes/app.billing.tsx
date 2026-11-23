import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { isTestBillingMode } from "../lib/billing-test-mode.server";
import { SHOPIFY_APP_IDENTITY } from "../lib/shopify-app-seo";
import { isPaidPlan } from "../lib/paid-plan";

/**
 * The app uses Shopify App Pricing (managed pricing): plans are defined in the
 * Partner Dashboard and Shopify hosts the plan selection page, including
 * approval, decline, plan changes, cancellation and re-approval on reinstall.
 * Creating charges ourselves via the Billing API is rejected for managed-
 * pricing apps, so this page only reads the current subscription and links
 * out. Consents Platform access is kept in sync by the
 * app_subscriptions/update webhook.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { billing, admin, session } = await authenticate.admin(request);
  const isTest = await isTestBillingMode(admin);
  const { appSubscriptions } = await billing.check({ isTest });
  // The free plan is an ACTIVE subscription too; only paid plans count.
  const active = appSubscriptions.find((s) => isPaidPlan(s.name));

  const response = await admin.graphql(`
    query CurrentAppHandle {
      currentAppInstallation {
        app {
          handle
        }
      }
    }
  `);
  const { data } = (await response.json()) as {
    data?: { currentAppInstallation?: { app?: { handle?: string } } };
  };
  const appHandle = data?.currentAppInstallation?.app?.handle;
  const storeHandle = session.shop.replace(".myshopify.com", "");

  return {
    activePlan: active?.name ?? null,
    isTest,
    platformUrl: SHOPIFY_APP_IDENTITY.platformUrl,
    pricingPlansUrl: appHandle
      ? `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`
      : null,
  };
}

export default function BillingPage() {
  const { activePlan, isTest, platformUrl, pricingPlansUrl } =
    useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Plans & billing" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {isTest ? (
              <Banner tone="info">
                This is a development store, so any plan you choose is a test
                charge and won't bill a real card.
              </Banner>
            ) : null}

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Shopify banner app
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Free, always. Every store can install and use the cookie
                  banner with Shopify's own consent log at no charge.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Intastellar Consents Platform
                    </Text>
                    {activePlan ? (
                      <Badge tone="success">{`${activePlan} plan`}</Badge>
                    ) : null}
                  </InlineStack>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    A paid subscription unlocks the hosted CMP dashboard at
                    intastellarconsents.com — consent analytics and
                    ad-platform reconciliation. Plans are billed monthly
                    through Shopify.
                  </Text>
                </BlockStack>

                {pricingPlansUrl ? null : (
                  <Banner tone="warning">
                    We couldn't load Shopify's plan page right now. Reload this
                    page to try again.
                  </Banner>
                )}

                <InlineStack gap="200">
                  {pricingPlansUrl ? (
                    <Button
                      url={pricingPlansUrl}
                      target="_top"
                      variant={activePlan ? undefined : "primary"}
                    >
                      {activePlan ? "Change or cancel plan" : "View plans"}
                    </Button>
                  ) : null}
                  {activePlan ? (
                    <Button url={platformUrl} target="_blank" variant="primary">
                      Open dashboard
                    </Button>
                  ) : null}
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
