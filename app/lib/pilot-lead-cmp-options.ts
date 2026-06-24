export const PILOT_CMP_OPTIONS = [
  { value: "none", label: "None / Shopify Customer Privacy only" },
  { value: "cookiebot", label: "Cookiebot" },
  { value: "cookieinformation", label: "Cookie Information" },
  { value: "onetrust", label: "OneTrust" },
  { value: "cookieyes", label: "CookieYes" },
  { value: "iubenda", label: "iubenda" },
  { value: "usercentrics", label: "Usercentrics" },
  { value: "termly", label: "Termly" },
  { value: "pandectes", label: "Pandectes" },
  { value: "other", label: "Other" },
] as const;

export type PilotCmpValue = (typeof PILOT_CMP_OPTIONS)[number]["value"];

export function formatPilotCmp(value: string, otherDetail?: string): string {
  const option = PILOT_CMP_OPTIONS.find((o) => o.value === value);
  if (value === "other" && otherDetail?.trim()) {
    return `Other: ${otherDetail.trim()}`;
  }
  return option?.label ?? value;
}
