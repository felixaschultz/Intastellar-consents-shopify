import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
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
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate, isTestBillingMode } from "../shopify.server";
import { BILLING_PLANS, BILLING_PLAN_PRICES, type BillingPlanName } from "../lib/billing-plans";
import { shopifyAppServerBase, SHOPIFY_APP_IDENTITY } from "../lib/shopify-app-seo";
import { syncConsentsPlatformAccess } from "../lib/consents-platform-billing.server";

const PLAN_ORDER: BillingPlanName[] = [
  BILLING_PLANS.PERSONAL,
  BILLING_PLANS.STARTER,
  BILLING_PLANS.GROWTH,
  BILLING_PLANS.AGENCY_PRO,
];

function isBillingPlanName(value: unknown): value is BillingPlanName {
  return (
    typeof value === "string" &&
    (Object.values(BILLING_PLANS) as string[]).includes(value)
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { billing } = await authenticate.admin(request);
  const isTest = isTestBillingMode();
  const { appSubscriptions } = await billing.check({ isTest });
  const active = appSubscriptions[0];

  return {
    activePlan: isBillingPlanName(active?.name) ? active.name : null,
    isTest,
    platformUrl: SHOPIFY_APP_IDENTITY.platformUrl,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { billing, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const isTest = isTestBillingMode();

  if (intent === "subscribe") {
    const plan = formData.get("plan");
    if (!isBillingPlanName(plan)) {
      throw new Response("Invalid plan", { status: 400 });
    }

    // Throws: redirects the merchant to Shopify's native billing
    // confirmation screen. Nothing past this line runs.
    await billing.request({
      plan,
      isTest,
      returnUrl: `${shopifyAppServerBase()}/app/billing`,
    });
  }

  if (intent === "cancel") {
    const { appSubscriptions } = await billing.check({ isTest });
    const active = appSubscriptions[0];
    if (active) {
      await billing.cancel({
        subscriptionId: active.id,
        isTest,
        prorate: true,
      });
      await syncConsentsPlatformAccess({
        shop: session.shop,
        plan: null,
        status: "CANCELLED",
      });
    }
  }

  return null;
}

export default function BillingPage() {
  const { activePlan, isTest, platformUrl } = useLoaderData<typeof loader>();
  const subscribeFetcher = useFetcher();
  const cancelFetcher = useFetcher();
  const busyPlan =
    subscribeFetcher.state !== "idle"
      ? subscribeFetcher.formData?.get("plan")
      : null;

  return (
    <Page>
      <TitleBar title="Plans & billing" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {isTest ? (
              <Banner tone="info">
                Running in test mode — subscriptions made here won't charge a
                real card.
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
                  <Text as="h2" variant="headingMd">
                    Intastellar Consents Platform
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    A paid subscription unlocks the hosted CMP dashboard at
                    intastellarconsents.com — consent analytics and
                    ad-platform reconciliation. Billed monthly through
                    Shopify.
                  </Text>
                </BlockStack>

                {activePlan ? (
                  <Banner tone="success">
                    You're subscribed to the {activePlan} plan.
                  </Banner>
                ) : null}

                <BlockStack gap="300">
                  {PLAN_ORDER.map((plan) => {
                    const isActive = activePlan === plan;
                    return (
                      <Box
                        key={plan}
                        padding="300"
                        borderWidth="025"
                        borderColor="border"
                        borderRadius="200"
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="050">
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="span" variant="headingSm">
                                {plan}
                              </Text>
                              {isActive ? (
                                <Badge tone="success">Current plan</Badge>
                              ) : null}
                            </InlineStack>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              €{BILLING_PLAN_PRICES[plan]} / month
                            </Text>
                          </BlockStack>

                          {isActive ? (
                            <Button
                              url={platformUrl}
                              target="_blank"
                              variant="primary"
                            >
                              Open dashboard
                            </Button>
                          ) : (
                            <subscribeFetcher.Form method="post">
                              <input type="hidden" name="intent" value="subscribe" />
                              <input type="hidden" name="plan" value={plan} />
                              <Button
                                submit
                                variant={activePlan ? undefined : "primary"}
                                loading={busyPlan === plan}
                              >
                                {activePlan ? "Switch to this plan" : "Subscribe"}
                              </Button>
                            </subscribeFetcher.Form>
                          )}
                        </InlineStack>
                      </Box>
                    );
                  })}
                </BlockStack>

                {activePlan ? (
                  <cancelFetcher.Form method="post">
                    <input type="hidden" name="intent" value="cancel" />
                    <Button
                      submit
                      variant="plain"
                      tone="critical"
                      loading={cancelFetcher.state !== "idle"}
                    >
                      Cancel subscription
                    </Button>
                  </cancelFetcher.Form>
                ) : null}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
