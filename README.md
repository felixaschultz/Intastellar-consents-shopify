# Intastellar Consents — Shopify app

Embedded [Shopify](https://shopify.dev/docs/apps) app (Remix) that stores your [Intastellar Consents](https://inta.dev) `window.INTA` configuration on the **app installation** (app-owned metafields) and injects the official **`uc.js`** script on the storefront via a **theme app embed** with target **`compliance_head`** — Shopify’s earliest [app embed head injection](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#app-embed-blocks) (runs before other `head` app embeds). Scripts still appear where the theme outputs `{{ content_for_header }}`; for maximum priority inside `<head>`, keep that tag near the top of `<head>` (after `charset` / essential meta).

## What merchants get

1. **Admin UI** (`/app`) — Edit banner-related settings that map to the JavaScript API (`policy_link`, `settings.*` such as `company`, `color`, `design`, `gtagId`, cookie lists, etc.).
2. **Live preview** — An iframe that loads `window.INTA` and `uc.js` in `<head>` (after charset/viewport), matching Intastellar’s “early head” integration style.
3. **Storefront** — After enabling the app embed, the theme outputs `window.INTA` from **`app.metafields`** (this app’s installation metafield) and always loads **`uc.js`** from Intastellar’s CDN.

Configuration is persisted as an **app installation metafield** (`intastellar_consents.banner_config`, type `json`). Shopify does **not** offer `read_metafields` / `write_metafields` OAuth scopes — access follows the owning resource; installation metafields are available to your app and to the [`app` Liquid object](https://shopify.dev/docs/api/liquid/objects/app) in theme app extensions.

**OAuth:** this app uses **no extra Admin API scopes** in `shopify.app.toml` (`scopes = ""`). If your workflow requires at least one scope, add a real scope from the [access scopes list](https://shopify.dev/docs/api/usage/access-scopes) (not `read_metafields` / `write_metafields`).

## Requirements

- Node **20.10+** (see `package.json` `engines`).
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) and a Partner app + dev store.

## Local development

```bash
nvm use 20   # or install Node 20+
npm install
shopify app dev
```

CLI will link `client_id`, tunnel URL, and `redirect_urls` in `shopify.app.toml` when `[build] automatically_update_urls_on_dev` is enabled.

### After install

1. Open the app from Shopify admin and **Save** your banner settings at least once (this writes the app installation metafield).
2. In **Online Store → Themes → Customize → App embeds**, turn on **Intastellar Consents**, or use the **Open theme editor** button in the app (deep link uses `activateAppId={SHOPIFY_API_KEY}/intastellar-consents` per [Shopify app embed docs](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#app-embed-block-deep-linking)).

## References

- [Intastellar developer documentation](https://inta.dev)
- [Intastellar help center](https://help.intastellarsolutions.com)
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `shopify app dev`  | Dev server + tunnel + extensions     |
| `npm run build`    | Remix production build               |
| `npx shopify app build` | Validate app + extension bundle |

## Pilot demo + Intastellar Accounts

When a visitor submits **Start free demo**, the app:

1. Saves a `PilotLead` row (email, store name, CMP).
2. Calls **Intastellar Accounts** to register the email (when configured).
3. **Emails you** (the operator) so you can create the dev store manually in the Partner Dashboard.
4. When you mark the store ready, calls Intastellar Accounts to **email the visitor** with the install link.

Shopify OAuth remains the install path for the embedded app; Intastellar Accounts is for the Consents Platform dashboard.

### Env vars (pilot signup)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `PILOT_OPERATOR_EMAIL` | Yes | Your inbox — notified on each demo request |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com) API key for operator emails |
| `PILOT_EMAIL_FROM` | Optional | Verified sender (default: `Intastellar Consents <notifications@consentsmanagement.com>`) |
| `PILOT_OPERATOR_SECRET` | Recommended | Secret for `/pilot-lead/complete` links in operator emails |

After you create the dev store, open the complete link from the email (or visit `/pilot-lead/complete?secret=…&id=…&shop=store.myshopify.com`) to notify the visitor.

### Env vars (Intastellar Accounts — intastellaraccounts.com)

Accounts are hosted on **one.com** under **intastellaraccounts.com**. Set these when the API endpoint is ready:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `INTASTELLAR_ACCOUNTS_REGISTER_URL` | For signup | **Full URL** to POST when a pilot submits the demo form (body includes `email` + pilot metadata). Creates the Intastellar Account. |
| `INTASTELLAR_ACCOUNTS_DEMO_READY_URL` | For email | **Full URL** to POST when the Shopify demo store is ready (Accounts sends “store ready + finish setup” email). |
| `INTASTELLAR_ACCOUNTS_API_KEY` | Optional | Bearer token if the API requires server auth |
| `INTASTELLAR_ACCOUNTS_SETUP_URL` | Optional | Fallback link for “finish account setup” (default: `https://intastellaraccounts.com/setup?email=…`) |

Until `INTASTELLAR_ACCOUNTS_REGISTER_URL` is set, pilot signup still works; account registration is skipped.

### Shopify App Store / entity SEO

Set when the app is listed:

| Variable | Description |
| -------- | ----------- |
| `SHOPIFY_APP_STORE_LISTING_URL` | Public App Store URL — added to JSON-LD `sameAs` so search/AI link the product |
| `PUBLIC_SITE_URL` | Public marketing site (default `https://consentsplatform.com`) — sitemap, canonical URLs, JSON-LD, install links |
| `SHOPIFY_APP_URL` | Shopify OAuth / embedded app server (default `https://app.consentsmanagement.com`) — must match `shopify.app.toml` |

Also link **to** `https://consentsplatform.com` from [Shopify integration page](https://www.intastellarsolutions.com/solutions/cookie-consents/integrations/shopify) and intastellarconsents.com with anchor text **“Intastellar Consents Shopify app”**.

### Register request (minimal)

The app will POST JSON like:

```json
{
  "email": "you@company.com",
  "storeName": "Acme Demo",
  "currentCmp": "Cookiebot",
  "source": "shopify_pilot",
  "pilotLeadId": "clx..."
}
```

Response may include `{ "accountId": "...", "setupUrl": "https://intastellaraccounts.com/..." }` — both fields are optional; the app stores whatever is returned.

### Demo-ready request (when second endpoint exists)

```json
{
  "email": "you@company.com",
  "storeName": "Acme Demo",
  "shopDomain": "acme-demo.myshopify.com",
  "installUrl": "https://consentsplatform.com/auth/login?shop=...",
  "intastellarAccountId": "...",
  "intastellarSetupUrl": "https://intastellaraccounts.com/...",
  "pilotLeadId": "clx..."
}
```

If register and demo-ready are the same service, you can expose one or two paths on intastellaraccounts.com — plug the full URLs into env when ready.

---

This repo was bootstrapped from [Shopify’s Remix app template](https://github.com/Shopify/shopify-app-template-remix).
