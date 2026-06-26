export const REPORT_CATEGORIES = [
  { value: "fake_profile", label: "Fake Profile" },
  { value: "scam_fraud", label: "Scam / Fraud" },
  { value: "harassment_abuse", label: "Harassment or Abuse" },
  { value: "inappropriate_messages", label: "Inappropriate Messages" },
  { value: "inappropriate_photos", label: "Inappropriate Photos" },
  { value: "impersonation", label: "Impersonation" },
  { value: "blackmail_extortion", label: "Blackmail or Extortion" },
  { value: "spam", label: "Spam" },
  { value: "underage", label: "Underage User" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "other", label: "Other" },
] as const;

export type ReportCategoryValue = (typeof REPORT_CATEGORIES)[number]["value"];

export function reportCategoryLabel(value: string | null | undefined): string {
  if (!value) return "Other";
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}