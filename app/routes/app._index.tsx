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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  defaultIntaConfig,
  loadAppInstallationHomeData,
  parseRequiredCookiesFromFormJson,
  saveAppInstallationIntaConfig,
  saveOnboardingState,
  type IntaConfig,
  type IntaRequiredCookie,
} from "../lib/intastellar-metafields.server";
import { fetchShopBrandAssets } from "../lib/shop-brand-logo.server";
import { IntastellarOnboardingModal } from "../components/IntastellarOnboardingModal";

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

  const { config, onboarding } = await loadAppInstallationHomeData(
    admin,
    shopCtx,
  );
  let shopLogoUrl: string | null = null;
  let shopBrandColor: string | null = null;
  try {
    const result = await fetchShopBrandAssets(admin);
    shopLogoUrl = result.logo;
    shopBrandColor = result.color;
  } catch {
    /* brand prefill optional; merchants can set logo/color manually */
  }

  const themeEditorEmbedUrl = `https://${shopNode.myshopifyDomain}/admin/themes/current/editor?context=apps&activateAppId=${process.env.SHOPIFY_API_KEY}/intastellar-consents`;
  return {
    config,
    shopLogoUrl,
    shopBrandColor,
    shop: {
      myshopifyDomain: shopNode.myshopifyDomain as string,
      name: shopCtx.name,
      primaryDomainHost,
    },
    themeEditorEmbedUrl,
    onboardingCompleted: onboarding.completed,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

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

  if (intent === "completeOnboarding") {
    const result = await saveOnboardingState(admin, installationId, {
      completed: true,
    });
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    return { ok: true as const, intent: "completeOnboarding" as const };
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
      requiredCookies: parseRequiredCookiesFromFormJson(
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
    shopLogoUrl,
    shopBrandColor,
    themeEditorEmbedUrl,
    shop,
    onboardingCompleted,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const initialConfig = useMemo((): IntaConfig => {
    const patched = { ...initial, settings: { ...initial.settings } };
    if (!patched.settings.logo && shopLogoUrl) patched.settings.logo = shopLogoUrl;
    if (!patched.settings.color && shopBrandColor) patched.settings.color = shopBrandColor;
    return patched;
  }, [initial, shopLogoUrl, shopBrandColor]);

  const [config, setConfig] = useState<IntaConfig>(initialConfig);
  const [requiredCookiesRows, setRequiredCookiesRows] = useState<
    IntaRequiredCookie[]
  >(() => [...initialConfig.settings.requiredCookies]);
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
      setRequiredCookiesRows([...data.config.settings.requiredCookies]);
      setKeepInLocalStorageRaw(
        data.config.settings.keepInLocalStorage.length
          ? JSON.stringify(data.config.settings.keepInLocalStorage)
          : "",
      );
    }
  },
    [fetcher.data]
  );

  const previewConfig = useMemo(
    (): IntaConfig => ({
      ...config,
      settings: {
        ...config.settings,
        requiredCookies: requiredCookiesRows,
        keepInLocalStorage: parseStringArray(keepInLocalStorageRaw),
      },
    }),
    [config, requiredCookiesRows, keepInLocalStorageRaw],
  );

  const patchRequiredCookieRow = useCallback(
    (index: number, patch: Partial<IntaRequiredCookie>) => {
      setRequiredCookiesRows((rows) =>
        rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const addRequiredCookieRow = useCallback(() => {
    setRequiredCookiesRows((rows) => [
      ...rows,
      {
        cookie: "",
        domain: "",
        provider: "",
        type: "",
        purpose: "",
      },
    ]);
  }, []);

  const removeRequiredCookieRow = useCallback((index: number) => {
    setRequiredCookiesRows((rows) => rows.filter((_, i) => i !== index));
  }, []);

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
    <Page fullWidth>
      <TitleBar title="Intastellar Consents" />
      <IntastellarOnboardingModal
        themeEditorEmbedUrl={themeEditorEmbedUrl}
        docsUrl={DOCS_URL}
        onboardingCompleted={onboardingCompleted}
      />
      <BlockStack gap="500">
        <Banner tone="info">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
             To show the banner on your store, you need to activate the app embed. Click the button below to open the theme editor — then just save.
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
          <Layout.Section variant="oneThird">
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
                        <BlockStack gap="200">
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            Banner Color
                          </Text>
                          <InlineStack gap="200" blockAlign="center">
                            <label htmlFor="banner-color-picker" style={{ lineHeight: 0 }}>
                              <input
                                id="banner-color-picker"
                                type="color"
                                value={
                                  /^#[0-9A-Fa-f]{6}$/.test(config.settings.color)
                                    ? config.settings.color
                                    : "#1a1a1a"
                                }
                                onChange={(e) =>
                                  updateSettings({ color: e.target.value })
                                }
                                aria-label="Banner color"
                                style={{
                                  width: 44,
                                  height: 36,
                                  padding: 2,
                                  border: "1px solid var(--p-color-border)",
                                  borderRadius: "var(--p-border-radius-200)",
                                  cursor: "pointer",
                                  backgroundColor: "transparent",
                                }}
                              />
                            </label>
                            <Box minWidth="110px">
                              <TextField
                                labelHidden
                                label="Hex"
                                name="color"
                                value={config.settings.color}
                                onChange={(v) => updateSettings({ color: v })}
                                autoComplete="off"
                                placeholder="#1a1a1a"
                              />
                            </Box>
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {shopBrandColor
                              ? "Prefilled from your shop brand settings when empty."
                              : "Pick a color or enter hex (e.g. #1a1a1a)"}
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                    <TextField
                      label="Logo URL (settings.logo)"
                      name="logo"
                      value={config.settings.logo}
                      onChange={(v) => updateSettings({ logo: v })}
                      autoComplete="off"
                      helpText={
                        shopLogoUrl
                          ? "Prefilled from your shop brand settings when empty."
                          : undefined
                      }
                    />
                    <Box minWidth="200px">
                        <Select
                          label="Banner Layout"
                          name="arrange"
                          options={[
                            { label: "Overlay", value: "overlay" },
                            { label: "Full width banner", value: "banner" },
                            { label: "Banner", value: "bannerV2"}
                          ]}
                          value={config.settings.design}
                          onChange={(v) =>
                            updateSettings({
                              design: v,
                            })
                          }
                        />
                    </Box>
                    <TextField
                      label="Google Analytics / gtag ID (settings.gtagId)"
                      name="gtagId"
                      value={config.settings.gtagId}
                      onChange={(v) => updateSettings({ gtagId: v })}
                      autoComplete="off"
                      helpText="Optional, e.g. G-XXXXXXXXXX"
                    />
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Required cookies
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Cookie name, domain, provider, type (e.g. functional), and
                        purpose. Saved as JSON on your installation metafield.
                      </Text>
                      <input
                        type="hidden"
                        name="requiredCookies"
                        value={JSON.stringify(requiredCookiesRows)}
                        readOnly
                      />
                      <Box overflowX="scroll">
                        <table
                          style={{
                            width: "100%",
                            minWidth: "720px",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead>
                            <tr>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "8px 8px 8px 0",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                  fontSize: "var(--p-font-size-300)",
                                  fontWeight: 600,
                                }}
                              >
                                Cookie
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "8px",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                  fontSize: "var(--p-font-size-300)",
                                  fontWeight: 600,
                                }}
                              >
                                Domain
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "8px",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                  fontSize: "var(--p-font-size-300)",
                                  fontWeight: 600,
                                }}
                              >
                                Provider
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "8px",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                  fontSize: "var(--p-font-size-300)",
                                  fontWeight: 600,
                                }}
                              >
                                Type
                              </th>
                              <th
                                style={{
                                  textAlign: "left",
                                  padding: "8px",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                  fontSize: "var(--p-font-size-300)",
                                  fontWeight: 600,
                                }}
                              >
                                Purpose
                              </th>
                              <th
                                style={{
                                  width: 88,
                                  padding: "8px",
                                  borderBottom:
                                    "1px solid var(--p-color-border)",
                                }}
                              />
                            </tr>
                          </thead>
                          <tbody>
                            {requiredCookiesRows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  style={{
                                    padding: "12px 0",
                                    color: "var(--p-color-text-secondary)",
                                  }}
                                >
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    No cookies yet. Use &quot;Add cookie&quot; to
                                    add one.
                                  </Text>
                                </td>
                              </tr>
                            ) : (
                              requiredCookiesRows.map((row, i) => (
                                <tr key={i}>
                                  <td
                                    style={{
                                      padding: "8px 8px 8px 0",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <TextField
                                      labelHidden
                                      label="Cookie"
                                      value={row.cookie}
                                      onChange={(v) =>
                                        patchRequiredCookieRow(i, { cookie: v })
                                      }
                                      autoComplete="off"
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <TextField
                                      labelHidden
                                      label="Domain"
                                      value={row.domain}
                                      onChange={(v) =>
                                        patchRequiredCookieRow(i, { domain: v })
                                      }
                                      autoComplete="off"
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <TextField
                                      labelHidden
                                      label="Provider"
                                      value={row.provider}
                                      onChange={(v) =>
                                        patchRequiredCookieRow(i, {
                                          provider: v,
                                        })
                                      }
                                      autoComplete="off"
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px",
                                      verticalAlign: "top",
                                      minWidth: 120,
                                    }}
                                  >
                                    <TextField
                                      labelHidden
                                      label="Type"
                                      value={row.type}
                                      onChange={(v) =>
                                        patchRequiredCookieRow(i, { type: v })
                                      }
                                      autoComplete="off"
                                      placeholder="e.g. functional"
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px",
                                      verticalAlign: "top",
                                      minWidth: 200,
                                    }}
                                  >
                                    <TextField
                                      labelHidden
                                      label="Purpose"
                                      value={row.purpose}
                                      onChange={(v) =>
                                        patchRequiredCookieRow(i, { purpose: v })
                                      }
                                      autoComplete="off"
                                      multiline={2}
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <Button
                                      submit={false}
                                      variant="plain"
                                      tone="critical"
                                      onClick={() => removeRequiredCookieRow(i)}
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </Box>
                      <InlineStack>
                        <Button submit={false} onClick={addRequiredCookieRow}>
                          Add cookie
                        </Button>
                      </InlineStack>
                    </BlockStack>
                    <TextField
                      label="Keep in localStorage"
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
                      height: "720px",
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
