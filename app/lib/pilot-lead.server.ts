import type { PilotLead } from "@prisma/client";
import { randomBytes } from "node:crypto";
import db from "../db.server";
import { formatPilotCmp } from "./pilot-lead-cmp-options";
import {
  buildPilotInstallUrl,
  notifyDemoStoreReady,
  registerPilotWithIntastellarAccounts,
} from "./intastellar-accounts.server";
import {
  isPilotSignupConfigured,
  notifyOperatorOfPilotLead,
} from "./pilot-notify.server";
import {
  publicPilotNotConfiguredMessage,
  publicPilotStartError,
} from "./public-messages.server";

export type PilotSignupInput = {
  email: string;
  storeName: string;
  cmpValue: string;
  cmpOther?: string;
};

export type PilotSignupResult =
  | {
      ok: true;
      email: string;
      message: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function createPollToken(): string {
  return randomBytes(24).toString("hex");
}

export function validatePilotSignupInput(
  input: PilotSignupInput,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = input.email.trim();
  const storeName = input.storeName.trim();
  const cmpValue = input.cmpValue.trim();

  if (!email) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address";

  if (!storeName) errors.storeName = "Store name is required";
  else if (storeName.length < 2) {
    errors.storeName = "Store name must be at least 2 characters";
  } else if (storeName.length > 80) {
    errors.storeName = "Store name must be 80 characters or fewer";
  }

  if (!cmpValue) errors.currentCmp = "Tell us which cookie banner you use today";
  if (cmpValue === "other" && !input.cmpOther?.trim()) {
    errors.cmpOther = "Please name your current CMP";
  }

  return errors;
}

async function updateLead(
  id: string,
  data: Partial<
    Pick<
      PilotLead,
      | "status"
      | "statusNote"
      | "shopDomain"
      | "currentCmp"
      | "intastellarAccountId"
      | "intastellarSetupUrl"
      | "intastellarAccountStatus"
      | "intastellarAccountNote"
      | "demoReadyEmailSentAt"
      | "operatorNotifiedAt"
    >
  >,
) {
  await db.pilotLead.update({ where: { id }, data });
}

async function registerIntastellarAccountForLead(
  lead: Pick<PilotLead, "id" | "email" | "storeName" | "currentCmp">,
): Promise<void> {
  const registration = await registerPilotWithIntastellarAccounts({
    email: lead.email,
    storeName: lead.storeName,
    currentCmp: lead.currentCmp,
    pilotLeadId: lead.id,
  });

  if (registration.ok) {
    await updateLead(lead.id, {
      intastellarAccountId: registration.accountId,
      intastellarSetupUrl: registration.setupUrl,
      intastellarAccountStatus: "registered",
    });
    return;
  }

  if (registration.skipped) {
    await updateLead(lead.id, {
      intastellarAccountStatus: "skipped",
      intastellarAccountNote: registration.message,
    });
    return;
  }

  await updateLead(lead.id, {
    intastellarAccountStatus: "failed",
    intastellarAccountNote: registration.message,
  });
}

async function sendDemoReadyEmailIfNeeded(
  lead: Pick<
    PilotLead,
    | "id"
    | "email"
    | "storeName"
    | "shopDomain"
    | "intastellarAccountId"
    | "intastellarSetupUrl"
    | "demoReadyEmailSentAt"
  >,
): Promise<void> {
  if (!lead.shopDomain || lead.demoReadyEmailSentAt) return;

  const notification = await notifyDemoStoreReady({
    email: lead.email,
    storeName: lead.storeName,
    shopDomain: lead.shopDomain,
    installUrl: buildPilotInstallUrl(lead.shopDomain),
    intastellarAccountId: lead.intastellarAccountId,
    intastellarSetupUrl: lead.intastellarSetupUrl,
    pilotLeadId: lead.id,
  });

  if (notification.ok || notification.skipped) {
    await updateLead(lead.id, { demoReadyEmailSentAt: new Date() });
    return;
  }

  console.error(
    "[pilot-lead] demo-ready email failed for lead",
    lead.id,
    notification.message,
  );
}

export async function startPilotSignup(
  input: PilotSignupInput,
): Promise<PilotSignupResult> {
  const fieldErrors = validatePilotSignupInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  if (!isPilotSignupConfigured()) {
    return {
      ok: false,
      message: publicPilotNotConfiguredMessage(),
    };
  }

  const email = input.email.trim().toLowerCase();
  const storeName = input.storeName.trim();
  const currentCmp = formatPilotCmp(input.cmpValue, input.cmpOther);
  const pollToken = createPollToken();

  try {
    const lead = await db.pilotLead.create({
      data: {
        email,
        storeName,
        currentCmp,
        pollToken,
        status: "PENDING",
      },
    });

    await registerIntastellarAccountForLead(lead);

    const notification = await notifyOperatorOfPilotLead(lead);
    if (notification.ok) {
      await updateLead(lead.id, { operatorNotifiedAt: new Date() });
    } else {
      console.error(
        "[pilot-lead] operator notification failed for lead",
        lead.id,
        notification.message,
      );
      await updateLead(lead.id, {
        statusNote: `Operator email failed: ${notification.message}`,
      });
      return {
        ok: false,
        message: publicPilotStartError(
          "We saved your request but could not notify our team. Please try again or contact Intastellar.",
        ),
      };
    }

    return {
      ok: true,
      email,
      message:
        "Thanks — we received your request. We'll email you when your demo store is ready (usually within one business day).",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save your pilot request";
    console.error("[pilot-lead] startPilotSignup failed", err);
    return {
      ok: false,
      message: publicPilotStartError(message),
    };
  }
}

function normalizeShopDomain(shop: string): string | null {
  const trimmed = shop.trim().toLowerCase();
  if (!trimmed) return null;
  const withDomain = trimmed.includes(".")
    ? trimmed
    : `${trimmed}.myshopify.com`;
  return SHOP_DOMAIN_PATTERN.test(withDomain) ? withDomain : null;
}

export type MarkPilotLeadReadyResult =
  | { ok: true; installUrl: string; email: string }
  | { ok: false; message: string };

/** Called by the operator after manually creating the dev store. */
export async function markPilotLeadReady(
  leadId: string,
  shopDomainInput: string,
): Promise<MarkPilotLeadReadyResult> {
  const shopDomain = normalizeShopDomain(shopDomainInput);
  if (!shopDomain) {
    return {
      ok: false,
      message: "Invalid shop domain. Use format: your-store.myshopify.com",
    };
  }

  const lead = await db.pilotLead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return { ok: false, message: "Pilot lead not found" };
  }

  if (lead.status === "READY" && lead.shopDomain === shopDomain) {
    await sendDemoReadyEmailIfNeeded(lead);
    return {
      ok: true,
      installUrl: buildPilotInstallUrl(shopDomain),
      email: lead.email,
    };
  }

  await updateLead(lead.id, {
    shopDomain,
    status: "READY",
    statusNote: null,
  });

  const readyLead = await db.pilotLead.findUnique({ where: { id: lead.id } });
  if (readyLead) {
    await sendDemoReadyEmailIfNeeded(readyLead);
  }

  return {
    ok: true,
    installUrl: buildPilotInstallUrl(shopDomain),
    email: lead.email,
  };
}

export async function findPilotLeadByShop(
  shopDomain: string,
): Promise<PilotLead | null> {
  const normalized = shopDomain.trim().toLowerCase();
  return db.pilotLead.findFirst({
    where: { shopDomain: normalized, status: "READY" },
    orderBy: { createdAt: "desc" },
  });
}

export { isPilotSignupConfigured };
