import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  TextField,
  Select,
  InlineStack,
  Banner,
  Link,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  defaultIntaConfig,
  loadAppInstallationIntaConfig,
  saveAppInstallationIntaConfig,
  type IntaConfig,
} from "../lib/intastellar-metafields.server";

const UC_JS_URL = "https://consents.cdn.intastellarsolutions.com/uc.js";
const DOCS_URL =
  "https://developers.intastellarsolutions.com/cookie-solutions/docs/js-docs";

function parseStringArray(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  try {
    const parsed = JSON.parse(t) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    /* fall through */
  }
  return t
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPreviewSrcDoc(config: IntaConfig): string {
  const payload = JSON.stringify(config).replace(/</g, "\\u003c");
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>window.INTA=${payload};</script>
<script src="${UC_JS_URL}"></script>
</head><body style="margin:0;background:#f1f1f1;min-height:360px;"></body></html>`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const shopRes = await admin.graphql(
    `#graphql
    query IntaBannerLoader {
      shop {
        id
        name
        myshopifyDomain
        primaryDomain {
          host
        }
      }
    }`,
  );
  const shopJson = await shopRes.json();
  const shopNode = shopJson.data?.shop;
  if (!shopNode?.id) {
    throw new Response("Shop unavailable", { status: 500 });
  }

  const primaryDomainHost = shopNode.primaryDomain?.host ?? "";
  const shopCtx = {
    name: String(shopNode.name ?? ""),
    primaryDomainHost,
  };

  const config = await loadAppInstallationIntaConfig(admin, shopCtx);

  const themeEditorEmbedUrl = `https://${shopNode.myshopifyDomain}/admin/themes/current/editor?context=apps&activateAppId=${process.env.SHOPIFY_API_KEY}/intastellar-consents`;

  return {
    config,
    shop: {
      myshopifyDomain: shopNode.myshopifyDomain as string,
      name: shopCtx.name,
      primaryDomainHost,
    },
    themeEditorEmbedUrl,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();

  const shopRes = await admin.graphql(
    `#graphql
    query IntaBannerActionContext {
      shop {
        id
        name
        primaryDomain { host }
      }
      currentAppInstallation {
        id
      }
    }`,
  );
  const shopJson = await shopRes.json();
  const shopNode = shopJson.data?.shop;
  const installationId = shopJson.data?.currentAppInstallation?.id as
    | string
    | undefined;
  if (!shopNode?.id || !installationId) {
    return {
      ok: false as const,
      message: "Shop or app installation unavailable",
    };
  }

  const primaryDomainHost = shopNode.primaryDomain?.host ?? "";
  const shopCtx = {
    name: String(shopNode.name ?? ""),
    primaryDomainHost,
  };

  const config: IntaConfig = {
    policy_link: String(form.get("policy_link") ?? "").trim(),
    settings: {
      ...defaultIntaConfig(shopCtx).settings,
      rootDomain: String(form.get("rootDomain") ?? "").trim(),
      company: String(form.get("company") ?? "").trim(),
      arrange:
        form.get("arrange") === "rtl"
          ? ("rtl" as const)
          : ("ltr" as const),
      color: String(form.get("color") ?? "").trim(),
      logo: String(form.get("logo") ?? "").trim(),
      design: String(form.get("design") ?? "").trim(),
      gtagId: String(form.get("gtagId") ?? "").trim(),
      requiredCookies: parseStringArray(
        String(form.get("requiredCookies") ?? ""),
      ),
      keepInLocalStorage: parseStringArray(
        String(form.get("keepInLocalStorage") ?? ""),
      ),
    },
  };

  if (!config.policy_link) {
    config.policy_link = defaultIntaConfig(shopCtx).policy_link;
  }
  if (!config.settings.rootDomain) {
    config.settings.rootDomain = defaultIntaConfig(shopCtx).settings.rootDomain;
  }
  if (!config.settings.company) {
    config.settings.company = defaultIntaConfig(shopCtx).settings.company;
  }
  if (!config.settings.design) {
    config.settings.design = defaultIntaConfig(shopCtx).settings.design;
  }
  if (!config.settings.color) {
    config.settings.color = defaultIntaConfig(shopCtx).settings.color;
  }

  const result = await saveAppInstallationIntaConfig(
    admin,
    installationId,
    config,
  );
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }
  return { ok: true as const, config };
};

export default function Index() {
  const {
    config: initial,
    themeEditorEmbedUrl,
    shop,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [config, setConfig] = useState<IntaConfig>(initial);
  const [requiredCookiesRaw, setRequiredCookiesRaw] = useState(() =>
    initial.settings.requiredCookies.length
      ? JSON.stringify(initial.settings.requiredCookies)
      : "",
  );
  const [keepInLocalStorageRaw, setKeepInLocalStorageRaw] = useState(() =>
    initial.settings.keepInLocalStorage.length
      ? JSON.stringify(initial.settings.keepInLocalStorage)
      : "",
  );

  const updateSettings = useCallback(
    (patch: Partial<IntaConfig["settings"]>) => {
      setConfig((c) => ({
        ...c,
        settings: { ...c.settings, ...patch },
      }));
    },
    [],
  );

  useEffect(() => {
    const data = fetcher.data;
    if (data && "ok" in data && data.ok === true && "config" in data) {
      setConfig(data.config);
      setRequiredCookiesRaw(
        data.config.settings.requiredCookies.length
          ? JSON.stringify(data.config.settings.requiredCookies)
          : "",
      );
      setKeepInLocalStorageRaw(
        data.config.settings.keepInLocalStorage.length
          ? JSON.stringify(data.config.settings.keepInLocalStorage)
          : "",
      );
    }
  }, [fetcher.data]);

  const previewConfig = useMemo(
    (): IntaConfig => ({
      ...config,
      settings: {
        ...config.settings,
        requiredCookies: parseStringArray(requiredCookiesRaw),
        keepInLocalStorage: parseStringArray(keepInLocalStorageRaw),
      },
    }),
    [config, requiredCookiesRaw, keepInLocalStorageRaw],
  );

  const previewSrcDoc = useMemo(
    () => buildPreviewSrcDoc(previewConfig),
    [previewConfig],
  );

  const saving =
    fetcher.state === "submitting" || fetcher.state === "loading";
  const saveError =
    fetcher.data && "ok" in fetcher.data && fetcher.data.ok === false
      ? fetcher.data.message
      : null;
  const saveOk =
    fetcher.data && "ok" in fetcher.data && fetcher.data.ok === true;

  return (
    <Page>
      <TitleBar title="Intastellar Consents" />
      <BlockStack gap="500">
        <Banner tone="info">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              The storefront banner is always loaded with{" "}
              <code>{UC_JS_URL}</code> after <code>window.INTA</code> is set, as
              described in the{" "}
              <Link url={DOCS_URL} target="_blank">
                Intastellar JavaScript documentation
              </Link>
              . Enable the app embed under{" "}
              <strong>Online Store → Themes → App embeds</strong> (or use the
              link below).
            </Text>
            <InlineStack gap="300" wrap>
              <Button url={themeEditorEmbedUrl} target="_blank">
                Open theme editor (activate embed)
              </Button>
              <Button url={DOCS_URL} target="_blank" variant="plain">
                JS docs
              </Button>
            </InlineStack>
          </BlockStack>
        </Banner>

        {saveError ? <Banner tone="critical">{saveError}</Banner> : null}
        {saveOk ? (
          <Banner tone="success">Banner settings saved to your shop.</Banner>
        ) : null}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Banner configuration
                </Text>
                <fetcher.Form method="post">
                  <BlockStack gap="300">
                    <TextField
                      label="Privacy policy URL (policy_link)"
                      name="policy_link"
                      value={config.policy_link}
                      onChange={(v) =>
                        setConfig((c) => ({ ...c, policy_link: v }))
                      }
                      autoComplete="url"
                      helpText="Linked from the banner; must be a valid URL on your store."
                    />
                    <TextField
                      label="Root domain (settings.rootDomain)"
                      name="rootDomain"
                      value={config.settings.rootDomain}
                      onChange={(v) => updateSettings({ rootDomain: v })}
                      autoComplete="off"
                      helpText={`Default from your shop: ${shop.primaryDomainHost || shop.myshopifyDomain}`}
                    />
                    <TextField
                      label="Company / brand (settings.company)"
                      name="company"
                      value={config.settings.company}
                      onChange={(v) => updateSettings({ company: v })}
                      autoComplete="organization"
                    />
                    <InlineStack gap="400" wrap blockAlign="start">
                      <Box minWidth="200px">
                        <Select
                          label="Banner Position"
                          name="arrange"
                          options={[
                            { label: "Left side", value: "ltr" },
                            { label: "Right side", value: "rtl" },
                          ]}
                          value={config.settings.arrange}
                          onChange={(v) =>
                            updateSettings({
                              arrange: v === "rtl" ? "rtl" : "ltr",
                            })
                          }
                        />
                      </Box>
                      <Box minWidth="200px">
                        <TextField
                          label="Banner Color"
                          name="color"
                          value={config.settings.color}
                          onChange={(v) => updateSettings({ color: v })}
                          autoComplete="off"
                          helpText="CSS color, e.g. #1a1a1a"
                        />
                      </Box>
                    </InlineStack>
                    <TextField
                      label="Logo URL (settings.logo)"
                      name="logo"
                      value={config.settings.logo}
                      onChange={(v) => updateSettings({ logo: v })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Layout (settings.design)"
                      name="design"
                      value={config.settings.design}
                      onChange={(v) => updateSettings({ design: v })}
                      autoComplete="off"
                      helpText="e.g. overlay (see Intastellar docs for supported values)"
                    />
                    <TextField
                      label="Google Analytics / gtag ID (settings.gtagId)"
                      name="gtagId"
                      value={config.settings.gtagId}
                      onChange={(v) => updateSettings({ gtagId: v })}
                      autoComplete="off"
                      helpText="Optional, e.g. G-XXXXXXXXXX"
                    />
                    <TextField
                      label="Required cookies (settings.requiredCookies)"
                      name="requiredCookies"
                      value={requiredCookiesRaw}
                      onChange={setRequiredCookiesRaw}
                      multiline={3}
                      autoComplete="off"
                      helpText="JSON array of strings, or comma-separated values (parsed on save)"
                    />
                    <TextField
                      label="Keep in localStorage (settings.keepInLocalStorage)"
                      name="keepInLocalStorage"
                      value={keepInLocalStorageRaw}
                      onChange={setKeepInLocalStorageRaw}
                      multiline={3}
                      autoComplete="off"
                      helpText="JSON array of strings, or comma-separated values (parsed on save)"
                    />
                    <InlineStack>
                      <Button submit variant="primary" loading={saving}>
                        Save
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </fetcher.Form>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Live preview
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Preview HTML puts <code>window.INTA</code> and{" "}
                  <code>uc.js</code> in <code>&lt;head&gt;</code> (right after
                  charset/viewport), like Intastellar’s docs. Changes update as
                  you edit; saving persists to the storefront embed.
                </Text>
                <Box
                  padding="0"
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                  overflowX="hidden"
                  overflowY="hidden"
                  minHeight="420px"
                >
                  <iframe
                    title="Intastellar banner preview"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    style={{
                      width: "100%",
                      height: "420px",
                      border: "none",
                      display: "block",
                    }}
                    srcDoc={previewSrcDoc}
                  />
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
