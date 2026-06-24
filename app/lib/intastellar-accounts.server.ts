/**
 * Intastellar Accounts integration (hosted on one.com — intastellaraccounts.com).
 *
 * Configure when the Accounts team provides endpoints:
 *
 *   INTASTELLAR_ACCOUNTS_REGISTER_URL  — full URL; POST with email (+ pilot metadata)
 *   INTASTELLAR_ACCOUNTS_DEMO_READY_URL — optional; POST when Shopify demo store is ready
 *   INTASTELLAR_ACCOUNTS_API_KEY       — optional bearer token if the API requires auth
 *   INTASTELLAR_ACCOUNTS_SETUP_URL     — optional “finish setup” link fallback
 */

import { publicSiteBase } from "./shopify-app-seo";

export type IntastellarAccountRegistrationInput = {
  email: string;
  storeName: string;
  currentCmp: string;
  pilotLeadId: string;
};

export type IntastellarAccountRegistrationResult =
  | {
      ok: true;
      accountId: string | null;
      setupUrl: string | null;
    }
  | { ok: false; message: string; skipped?: boolean };

export type DemoReadyNotificationInput = {
  email: string;
  storeName: string;
  shopDomain: string;
  installUrl: string;
  intastellarAccountId: string | null;
  intastellarSetupUrl: string | null;
  pilotLeadId: string;
};

export type DemoReadyNotificationResult =
  | { ok: true }
  | { ok: false; message: string; skipped?: boolean };

const DEFAULT_SETUP_ORIGIN = "https://intastellaraccounts.com";

function registerUrl(): string | null {
  return process.env.INTASTELLAR_ACCOUNTS_REGISTER_URL?.trim() || null;
}

function demoReadyUrl(): string | null {
  return process.env.INTASTELLAR_ACCOUNTS_DEMO_READY_URL?.trim() || null;
}

function accountsApiKey(): string | null {
  return process.env.INTASTELLAR_ACCOUNTS_API_KEY?.trim() || null;
}

export function isIntastellarAccountsRegisterConfigured(): boolean {
  return Boolean(registerUrl());
}

export function isIntastellarAccountsDemoReadyConfigured(): boolean {
  return Boolean(demoReadyUrl());
}

export function defaultIntastellarSetupUrl(email: string): string {
  const base =
    process.env.INTASTELLAR_ACCOUNTS_SETUP_URL?.trim() ||
    `${DEFAULT_SETUP_ORIGIN}/setup`;
  const url = new URL(base);
  url.searchParams.set("email", email);
  url.searchParams.set("source", "shopify_pilot");
  return url.toString();
}

async function postAccountsJson<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const key = accountsApiKey();
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, message };
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Intastellar Accounts API returned ${response.status}`;
    return { ok: false, message };
  }

  return { ok: true, data: payload as T };
}

/** Create an Intastellar Account from pilot signup (email is required by Accounts). */
export async function registerPilotWithIntastellarAccounts(
  input: IntastellarAccountRegistrationInput,
): Promise<IntastellarAccountRegistrationResult> {
  const url = registerUrl();
  if (!url) {
    console.warn(
      "[intastellar-accounts] Skipping registration — set INTASTELLAR_ACCOUNTS_REGISTER_URL " +
        "(intastellaraccounts.com endpoint when ready)",
    );
    return {
      ok: false,
      message: "Intastellar Accounts register URL not configured",
      skipped: true,
    };
  }

  const result = await postAccountsJson<{
    accountId?: string;
    id?: string;
    setupUrl?: string;
  }>(url, {
    email: input.email,
    storeName: input.storeName,
    currentCmp: input.currentCmp,
    source: "shopify_pilot",
    pilotLeadId: input.pilotLeadId,
  });

  if (!result.ok) {
    console.error("[intastellar-accounts] registration failed:", result.message);
    return { ok: false, message: result.message };
  }

  const accountId =
    result.data.accountId?.trim() || result.data.id?.trim() || null;
  const setupUrl =
    result.data.setupUrl?.trim() || defaultIntastellarSetupUrl(input.email);

  return { ok: true, accountId, setupUrl };
}

/** Notify Intastellar Accounts to email the user that the demo store is ready. */
export async function notifyDemoStoreReady(
  input: DemoReadyNotificationInput,
): Promise<DemoReadyNotificationResult> {
  const url = demoReadyUrl();
  if (!url) {
    console.warn(
      "[intastellar-accounts] Skipping demo-ready email — set INTASTELLAR_ACCOUNTS_DEMO_READY_URL when ready",
    );
    return {
      ok: false,
      message: "Intastellar Accounts demo-ready URL not configured",
      skipped: true,
    };
  }

  const setupUrl =
    input.intastellarSetupUrl || defaultIntastellarSetupUrl(input.email);

  const result = await postAccountsJson<{ sent?: boolean }>(url, {
    email: input.email,
    storeName: input.storeName,
    shopDomain: input.shopDomain,
    installUrl: input.installUrl,
    intastellarAccountId: input.intastellarAccountId,
    intastellarSetupUrl: setupUrl,
    pilotLeadId: input.pilotLeadId,
  });

  if (!result.ok) {
    console.error("[intastellar-accounts] demo-ready notification failed:", result.message);
    return { ok: false, message: result.message };
  }

  return { ok: true };
}

export function buildPilotInstallUrl(shopDomain: string): string {
  return `${publicSiteBase()}/auth/login?shop=${encodeURIComponent(shopDomain)}`;
}
