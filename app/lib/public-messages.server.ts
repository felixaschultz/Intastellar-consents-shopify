/** True when running a local / non-production deploy (show operator hints). */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

const PILOT_STORE_GENERIC =
  "We couldn't set up your demo store right now. Use \"Install directly\" with your store URL, or contact Intastellar for a pilot invite.";

const PILOT_POLL_GENERIC =
  "Demo store setup didn't complete. Please try again or install on an existing store.";

const PILOT_START_GENERIC =
  "Something went wrong while starting demo setup. Please try again later.";

/** Maps internal pilot/store errors to a safe message for landing-page visitors. */
export function publicPilotStoreError(internal: string): string {
  if (isDevEnvironment()) {
    return internal.startsWith("We could not create your demo store:")
      ? internal
      : `We could not create your demo store: ${internal}`;
  }
  console.error("[pilot] store error:", internal);
  return PILOT_STORE_GENERIC;
}

export function publicPilotStartError(internal: string): string {
  if (isDevEnvironment()) {
    return internal.startsWith("We could not start your demo store setup:")
      ? internal
      : `We could not start your demo store setup: ${internal}`;
  }
  console.error("[pilot] start error:", internal);
  return PILOT_START_GENERIC;
}

export function publicPilotPollError(internal: string): string {
  if (isDevEnvironment()) return internal;
  console.error("[pilot] poll error:", internal);
  return PILOT_POLL_GENERIC;
}

export function publicPilotNotConfiguredMessage(): string {
  if (isDevEnvironment()) {
    return (
      "Automated demo store setup is not configured yet. Use “Install on an existing store” below, " +
      "or contact Intastellar for a pilot invite."
    );
  }
  return (
    "Demo store signup is temporarily unavailable. Install on your existing Shopify store below, " +
    "or contact Intastellar for a pilot invite."
  );
}
