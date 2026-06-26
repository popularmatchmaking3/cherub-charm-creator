// Calculate profile completion % based on filled fields.
// Kept simple & deterministic so users see what's missing.
export const COMPLETION_FIELDS = [
  { key: "avatar_url", label: "Profile photo" },
  { key: "full_name", label: "Full name" },
  { key: "gender", label: "Gender" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "marital_status", label: "Marital status" },
  { key: "disability_category", label: "Disability category" },
  { key: "religion", label: "Religion" },
  { key: "mother_tongue", label: "Mother tongue" },
  { key: "education", label: "Education" },
  { key: "occupation", label: "Occupation" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "about", label: "About you" },
  { key: "partner_preferences", label: "Partner preferences" },
] as const;

export type CompletionInput = Partial<Record<(typeof COMPLETION_FIELDS)[number]["key"], unknown>>;

export function calcCompletion(profile: CompletionInput | null | undefined) {
  if (!profile) return { percent: 0, missing: COMPLETION_FIELDS.map((f) => f.label) };
  const filled: string[] = [];
  const missing: string[] = [];
  for (const f of COMPLETION_FIELDS) {
    const v = profile[f.key];
    const ok = typeof v === "string" ? v.trim().length > 0 : v != null;
    if (ok) filled.push(f.label);
    else missing.push(f.label);
  }
  const percent = Math.round((filled.length / COMPLETION_FIELDS.length) * 100);
  return { percent, missing };
}