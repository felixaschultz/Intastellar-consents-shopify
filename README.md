# Intastellar Consents — Shopify app

Embedded [Shopify](https://shopify.dev/docs/apps) app (Remix) that stores your [Intastellar Consents](https://developers.intastellarsolutions.com/cookie-solutions/docs/js-docs) `window.INTA` configuration on the **app installation** (app-owned metafields) and injects the official **`uc.js`** script on the storefront via a **theme app embed** with target **`compliance_head`** — Shopify’s earliest [app embed head injection](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#app-embed-blocks) (runs before other `head` app embeds). Scripts still appear where the theme outputs `{{ content_for_header }}`; for maximum priority inside `<head>`, keep that tag near the top of `<head>` (after `charset` / essential meta).

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

- [Intastellar JavaScript documentation](https://developers.intastellarsolutions.com/cookie-solutions/docs/js-docs)
- [Intastellar documentation hub](https://developers.intastellarsolutions.com/cookie-solutions/docs)
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `shopify app dev`  | Dev server + tunnel + extensions     |
| `npm run build`    | Remix production build               |
| `npx shopify app build` | Validate app + extension bundle |

---

This repo was bootstrapped from [Shopify’s Remix app template](https://github.com/Shopify/shopify-app-template-remix).
