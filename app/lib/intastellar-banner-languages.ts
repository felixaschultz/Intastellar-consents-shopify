/** Values for `window.INTA.settings.language` (Intastellar Consents banner). */
export const BANNER_LANGUAGE_OPTIONS = [
  { label: "Auto (from page language)", value: "auto" },
  { label: "Danish", value: "danish" },
  { label: "Dutch", value: "dutch" },
  { label: "English", value: "english" },
  { label: "German", value: "german" },
  { label: "French", value: "french" },
  { label: "Italian (Italiano)", value: "italian" },
  { label: "Polish (Polski)", value: "polish" },
  { label: "Spanish", value: "spanish" },
  { label: "Norwegian", value: "norwegian" },
  { label: "Korean", value: "korean" },
  { label: "Japanese", value: "japanese" },
  { label: "Russian", value: "russian" },
  { label: "Finnish", value: "finnish" },
  { label: "Swedish", value: "swedish" },
] as const;

export type BannerLanguage = (typeof BANNER_LANGUAGE_OPTIONS)[number]["value"];

const BANNER_LANGUAGE_SET = new Set<string>(
  BANNER_LANGUAGE_OPTIONS.map((o) => o.value),
);

export function normalizeBannerLanguage(raw: unknown): BannerLanguage {
  if (typeof raw === "string" && BANNER_LANGUAGE_SET.has(raw)) {
    return raw as BannerLanguage;
  }
  return "auto";
}
