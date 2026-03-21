import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  InlineStack,
  Link,
  List,
  Modal,
  ProgressBar,
  Text,
} from "@shopify/polaris";

const ONBOARDING_SKIP_SESSION_KEY = "inta_onboarding_skip_session";

const STEP_COUNT = 5;

type OnboardingActionResponse =
  | { ok: true; intent: "completeOnboarding" }
  | { ok: false; message: string };

type Props = {
  themeEditorEmbedUrl: string;
  docsUrl: string;
  onboardingCompleted: boolean;
};

export function IntastellarOnboardingModal({
  themeEditorEmbedUrl,
  docsUrl,
  onboardingCompleted,
}: Props) {
  const fetcher = useFetcher<OnboardingActionResponse>();
  const revalidator = useRevalidator();

  const [skippedThisSession, setSkippedThisSession] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [reopen, setReopen] = useState(false);
  const [step, setStep] = useState(0);
  /** True while this fetcher is mid-request; used so stale success data doesn’t close “Show setup guide”. */
  const onboardingFetchActiveRef = useRef(false);

  const completing =
    fetcher.state === "submitting" || fetcher.state === "loading";

  useEffect(() => {
    if (typeof sessionStorage !== "undefined") {
      setSkippedThisSession(
        sessionStorage.getItem(ONBOARDING_SKIP_SESSION_KEY) === "1",
      );
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (fetcher.state === "submitting" || fetcher.state === "loading") {
      onboardingFetchActiveRef.current = true;
      return;
    }
    if (
      fetcher.state === "idle" &&
      onboardingFetchActiveRef.current
    ) {
      onboardingFetchActiveRef.current = false;
      const d = fetcher.data;
      if (
        d &&
        "ok" in d &&
        d.ok === true &&
        "intent" in d &&
        d.intent === "completeOnboarding"
      ) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(ONBOARDING_SKIP_SESSION_KEY);
        }
        setReopen(false);
        setStep(0);
        revalidator.revalidate();
      }
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  const showModal =
    storageReady &&
    ((!onboardingCompleted && !skippedThisSession) || reopen);

  const closeModal = useCallback(() => {
    setReopen(false);
    setStep(0);
  }, []);

  const skipForNow = useCallback(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(ONBOARDING_SKIP_SESSION_KEY, "1");
    }
    setSkippedThisSession(true);
    setStep(0);
    if (reopen) setReopen(false);
  }, [reopen]);

  const openGuideAgain = useCallback(() => {
    setReopen(true);
    setStep(0);
  }, []);

  const completeOnboarding = useCallback(() => {
    const fd = new FormData();
    fd.set("intent", "completeOnboarding");
    fetcher.submit(fd, { method: "post" });
  }, [fetcher]);

  const handleModalClose = reopen ? closeModal : skipForNow;

  const onboardingError =
    fetcher.data &&
    "ok" in fetcher.data &&
    fetcher.data.ok === false &&
    "message" in fetcher.data
      ? fetcher.data.message
      : null;

  const primaryAction =
    step < STEP_COUNT - 1
      ? {
          content: "Next",
          onAction: () => setStep((s) => Math.min(s + 1, STEP_COUNT - 1)),
        }
      : {
          content: completing ? "Saving…" : "Finish setup",
          onAction: completeOnboarding,
          loading: completing,
        };

  return (
    <>
      {onboardingCompleted ? (
        <Box paddingInlineStart="0" paddingBlockEnd="100">
          <Button variant="plain" onClick={openGuideAgain}>
            Show setup guide
          </Button>
        </Box>
      ) : null}

      <Modal
        open={showModal}
        onClose={handleModalClose}
        title="Get started with Intastellar Consents"
        size="large"
        primaryAction={primaryAction}
        secondaryActions={[
          ...(step > 0
            ? [
                {
                  content: "Back",
                  onAction: () => setStep((s) => Math.max(0, s - 1)),
                },
              ]
            : []),
          {
            content: "Skip for now",
            onAction: skipForNow,
            disabled: completing,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <ProgressBar
              progress={((step + 1) / STEP_COUNT) * 100}
              size="small"
            />
            <Text as="p" variant="bodySm" tone="subdued">
              Step {step + 1} of {STEP_COUNT}
            </Text>

            {onboardingError ? (
              <Banner tone="critical">{onboardingError}</Banner>
            ) : null}

            {step === 0 ? (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd">
                  This app adds Intastellar’s cookie consent banner to your
                  storefront. The banner loads automatically to your store pages - no coding needed.
                </Text>
                <Text as="p" variant="bodyMd">
                  These steps take a few minutes: configure the banner, save,
                  then enable the embed in your theme.
                </Text>
              </BlockStack>
            ) : null}

            {step === 1 ? (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Configure your banner
                </Text>
                <List type="number">
                  <List.Item>
                    Set your <strong>privacy policy URL</strong> (required for
                    the banner link).
                  </List.Item>
                  <List.Item>
                    Adjust <strong>company name</strong>,{" "}
                    <strong>colors</strong>, <strong>logo</strong>, and layout
                    if you like—defaults work for many stores.
                  </List.Item>
                  <List.Item>
                    Optional: add Google Analytics / gtag ID or cookie lists if
                    your Intastellar setup needs them.
                  </List.Item>
                </List>
                <Text as="p" variant="bodySm" tone="subdued">
                  You’ll find these fields in the{" "}
                  <strong>Banner configuration</strong> card on this page.
                </Text>
              </BlockStack>
            ) : null}

            {step === 2 ? (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Save your settings
                </Text>
                <Text as="p" variant="bodyMd">
                  Click <strong>Save</strong> in the banner configuration form so
                  your choices are stored on this app installation. The theme
                  embed reads them from{" "}
                  <code>app.metafields</code> when the storefront loads.
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  You can change settings any time—just save again after edits.
                </Text>
              </BlockStack>
            ) : null}

            {step === 3 ? (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Turn on the theme app embed
                </Text>
                <Text as="p" variant="bodyMd">
                  Open the theme editor and enable the{" "}
                  <strong>Intastellar Consents</strong> app embed under{" "}
                  <strong>App embeds</strong>, then save the theme. Without this,
                  the banner will not appear on your store.
                </Text>
                <InlineStack gap="300" wrap>
                  <Button url={themeEditorEmbedUrl} target="_blank">
                    Open theme editor
                  </Button>
                  <Link url={docsUrl} target="_blank">
                    Intastellar JS docs
                  </Link>
                </InlineStack>
              </BlockStack>
            ) : null}

            {step === 4 ? (
              <BlockStack gap="300">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  You’re ready
                </Text>
                <Text as="p" variant="bodyMd">
                  After saving your banner settings and enabling the embed,
                  visit your storefront to confirm the banner appears. Tap{" "}
                  <strong>Finish setup</strong> to hide this guide; you can
                  reopen it anytime with <strong>Show setup guide</strong>.
                </Text>
              </BlockStack>
            ) : null}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
