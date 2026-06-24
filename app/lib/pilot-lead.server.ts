import { createHmac, randomBytes } from "node:crypto";
import type { PilotLead, PilotLeadStatus } from "@prisma/client";
import db from "../db.server";
import {
  createAppDevelopmentStore,
  isPilotStoreProvisioningConfigured,
  pollStoreCreationStatus,
} from "./partner-dev-store.server";
import { formatPilotCmp } from "./pilot-lead-cmp-options";

export type PilotSignupInput = {
  email: string;
  storeName: string;
  cmpValue: string;
  cmpOther?: string;
};

export type PilotSignupResult =
  | {
      ok: true;
      pollToken: string;
      shopDomain: string;
      email: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    Pick<PilotLead, "status" | "statusNote" | "shopDomain" | "currentCmp">
  >,
) {
  await db.pilotLead.update({ where: { id }, data });
}

export async function startPilotSignup(
  input: PilotSignupInput,
): Promise<PilotSignupResult> {
  const fieldErrors = validatePilotSignupInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  if (!isPilotStoreProvisioningConfigured()) {
    return {
      ok: false,
      message:
        "Automated demo store setup is not configured yet. Use “Install on an existing store” below, or contact Intastellar for a pilot invite.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const storeName = input.storeName.trim();
  const currentCmp = formatPilotCmp(input.cmpValue, input.cmpOther);
  const pollToken = createPollToken();

  const lead = await db.pilotLead.create({
    data: {
      email,
      storeName,
      currentCmp,
      pollToken,
      status: "PENDING",
    },
  });

  try {
    await updateLead(lead.id, { status: "CREATING" });
    const { shopDomain } = await createAppDevelopmentStore(storeName);
    await updateLead(lead.id, { shopDomain, status: "CREATING" });
    return { ok: true, pollToken, shopDomain, email };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create development store";
    await updateLead(lead.id, { status: "FAILED", statusNote: message });
    return {
      ok: false,
      message: `We could not create your demo store: ${message}`,
    };
  }
}

export type PilotPollResult = {
  status: PilotLeadStatus | "COMPLETE";
  shopDomain: string | null;
  message: string;
  installPath: string | null;
};

export async function pollPilotLead(
  pollToken: string,
  shopDomainParam?: string,
): Promise<PilotPollResult | null> {
  const lead = await db.pilotLead.findUnique({ where: { pollToken } });
  if (!lead) return null;

  if (lead.status === "FAILED") {
    return {
      status: "FAILED",
      shopDomain: lead.shopDomain,
      message: lead.statusNote ?? "Store setup failed",
      installPath: null,
    };
  }

  if (lead.status === "READY" && lead.shopDomain) {
    return {
      status: "READY",
      shopDomain: lead.shopDomain,
      message: "Your demo store is ready",
      installPath: `/auth/login?shop=${encodeURIComponent(lead.shopDomain)}`,
    };
  }

  const shopDomain = lead.shopDomain ?? shopDomainParam ?? null;
  if (!shopDomain) {
    return {
      status: lead.status,
      shopDomain: null,
      message: "Waiting for store domain…",
      installPath: null,
    };
  }

  try {
    const creationStatus = await pollStoreCreationStatus(shopDomain);
    if (creationStatus === "COMPLETE") {
      await updateLead(lead.id, { status: "READY" });
      return {
        status: "READY",
        shopDomain,
        message: "Your demo store is ready",
        installPath: `/auth/login?shop=${encodeURIComponent(shopDomain)}`,
      };
    }
    if (
      creationStatus === "FAILED" ||
      creationStatus === "TIMED_OUT" ||
      creationStatus === "USER_ERROR"
    ) {
      const note = `Store provisioning failed (${creationStatus})`;
      await updateLead(lead.id, { status: "FAILED", statusNote: note });
      return {
        status: "FAILED",
        shopDomain,
        message: note,
        installPath: null,
      };
    }
    return {
      status: "CREATING",
      shopDomain,
      message: friendlyCreationStatus(creationStatus),
      installPath: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not check store status";
    return {
      status: "CREATING",
      shopDomain,
      message,
      installPath: null,
    };
  }
}

function friendlyCreationStatus(status: string): string {
  switch (status) {
    case "CALLING_CORE":
      return "Starting your demo store…";
    case "AWAITING_CORE_STORE_READY":
      return "Shopify is preparing your storefront…";
    case "FINALIZING":
      return "Almost ready…";
    default:
      return "Setting up your demo store…";
  }
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

/** Optional signed token for poll endpoint hardening (pollToken is already secret). */
export function signPollToken(pollToken: string): string {
  const secret = process.env.SHOPIFY_API_SECRET ?? "";
  if (!secret) return pollToken;
  return createHmac("sha256", secret).update(pollToken).digest("hex");
}
