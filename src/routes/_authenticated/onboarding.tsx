import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DISABILITY_CATEGORIES, GENDERS, MARITAL_STATUSES,
  RELIGIONS, EDUCATION_LEVELS, EMPLOYMENT_TYPES,
} from "@/lib/profile-options";
import { LocationPicker } from "@/components/location-picker";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — United Disabled Matrimony" }] }),
  component: Onboarding,
});

const PHONE_RE = /^[+0-9 ()-]{7,20}$/;

type HabitsState = {
  drinks: "" | "yes" | "no";
  drinks_detail: string;
  smokes: "" | "yes" | "no";
  smokes_detail: string;
  other: "" | "yes" | "no";
  other_detail: string;
};

const DEFAULT_HABITS: HabitsState = {
  drinks: "", drinks_detail: "",
  smokes: "", smokes_detail: "",
  other: "", other_detail: "",
};

const schema = z.object({
  created_for: z.enum(["myself","son","daughter","brother","sister","friend","relative","other"], {
    message: "Please choose who this profile is for",
  }),
  guardian_name: z.string().trim().max(100).optional().or(z.literal("")),
  guardian_relation: z.string().trim().max(100).optional().or(z.literal("")),
  guardian_phone: z.string().trim().max(20).optional().or(z.literal("")),
  guardian_email: z.string().trim().max(200).optional().or(z.literal("")),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  gender: z.enum(["male", "female", "other"], { message: "Please select a gender" }),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  disability_category: z.enum([
    "visually_impaired","hearing_impaired","speech_impaired",
    "locomotor","intellectual","multiple","other",
  ], { message: "Please select a disability category" }),
  disability_percentage: z.number().min(0).max(100),
  religion: z.string().trim().max(100).optional().or(z.literal("")),
  mother_tongue: z.string().trim().max(100).optional().or(z.literal("")),
  marital_status: z.enum(["never_married","divorced","widowed"], {
    message: "Please select marital status",
  }),
  education: z.string().trim().max(200).optional().or(z.literal("")),
  occupation: z.string().trim().max(200).optional().or(z.literal("")),
  employment_type: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  about: z.string().trim().max(1000).optional().or(z.literal("")),
  partner_preferences: z.string().trim().max(1000).optional().or(z.literal("")),
  interests: z.array(z.string()).default([]),
  custom_interest: z.string().trim().max(200).optional().or(z.literal("")),
  habits: z.custom<HabitsState>().default(DEFAULT_HABITS),
  family_details: z.string().trim().max(1000).optional().or(z.literal("")),
  annual_income: z.string().trim().max(100).optional().or(z.literal("")),
  partner_min_age: z.number().min(18).max(99).optional(),
  partner_max_age: z.number().min(18).max(99).optional(),
  partner_about: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((val, ctx) => {
  if (val.created_for && val.created_for !== "myself") {
    if (!val.guardian_name || val.guardian_name.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["guardian_name"],
        message: "Your full name is required" });
    }
    if (!val.guardian_relation || val.guardian_relation.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["guardian_relation"],
        message: "Please enter your relation to the person" });
    }
    if (!val.guardian_phone || !PHONE_RE.test(val.guardian_phone)) {
      ctx.addIssue({ code: "custom", path: ["guardian_phone"],
        message: "Please enter a valid phone number" });
    }
    if (!val.guardian_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.guardian_email)) {
      ctx.addIssue({ code: "custom", path: ["guardian_email"],
        message: "Please enter a valid email address" });
    }
  }
});

type Errors = Partial<Record<keyof FormState, string>>;

function validateStep(form: FormState, isForSelf: boolean, stepKey: string): Errors {
  const e: Errors = {};
  if (stepKey === "for-whom") {
    if (!form.created_for) e.created_for = "Please choose who this profile is for";
  } else if (stepKey === "guardian") {
    if (!form.guardian_name || form.guardian_name.trim().length < 2)
      e.guardian_name = "Your full name is required";
    if (!form.guardian_relation || form.guardian_relation.trim().length < 2)
      e.guardian_relation = "Please enter your relation to the person";
    if (!form.guardian_phone || !PHONE_RE.test(form.guardian_phone))
      e.guardian_phone = "Please enter a valid phone number";
    if (!form.guardian_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardian_email))
      e.guardian_email = "Please enter a valid email address";
  } else if (stepKey === "basics") {
    if (!form.full_name || form.full_name.trim().length < 2)
      e.full_name = isForSelf ? "Full name is required" : "Their full name is required";
    if (!form.gender) e.gender = "Please select a gender";
    if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
    else {
      const dob = new Date(form.date_of_birth);
      if (Number.isNaN(dob.getTime())) {
        e.date_of_birth = "Please enter a valid date";
      } else {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 18) e.date_of_birth = "You must be at least 18 years old to use United Disabled Matrimony.";
        else if (age > 120) e.date_of_birth = "Please enter a valid date of birth.";
      }
    }
    if (!form.marital_status) e.marital_status = "Please select marital status";
  } else if (stepKey === "disability") {
    if (!form.disability_category) e.disability_category = "Please select a disability category";
    if (form.disability_percentage < 0 || form.disability_percentage > 100)
      e.disability_percentage = "Percentage must be between 0 and 100";
  } else if (stepKey === "background") {
    /* no extra validation */
  }
  return e;
}

type FormState = {
  created_for: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_phone: string;
  guardian_email: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  disability_category: string;
  disability_percentage: number;
  religion: string;
  mother_tongue: string;
  marital_status: string;
  education: string;
  occupation: string;
  employment_type: string;
  city: string;
  state: string;
  country: string;
  about: string;
  partner_preferences: string;
  interests: string[];
  custom_interest: string;
  habits: HabitsState;
  family_details: string;
  annual_income: string;
  partner_min_age: number | undefined;
  partner_max_age: number | undefined;
  partner_about: string;
};

const CREATED_FOR_OPTIONS = [
  { value: "myself", label: "Myself" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "friend", label: "Friend" },
  { value: "relative", label: "Relative" },
  { value: "other", label: "Other" },
];

const RELATION_LABEL: Record<string, string> = {
  son: "Parent / Guardian details",
  daughter: "Parent / Guardian details",
  brother: "Your details (brother/sister creating this profile)",
  sister: "Your details (brother/sister creating this profile)",
  friend: "Your details (friend creating this profile)",
  relative: "Your details (relative creating this profile)",
  other: "Your details (person creating this profile)",
};

const RELATION_OPTIONS: Record<string, string[]> = {
  son: ["Father", "Mother", "Guardian", "Brother", "Sister", "Other"],
  daughter: ["Father", "Mother", "Guardian", "Brother", "Sister", "Other"],
  brother: ["Brother", "Sister"],
  sister: ["Brother", "Sister"],
  friend: ["Friend"],
  relative: ["Uncle", "Aunt", "Cousin", "Brother", "Sister", "Grandparent", "Other"],
  other: ["Other"],
};

// Human label for the person whose profile this is (used in field labels).
const PROFILE_PERSON_LABEL: Record<string, string> = {
  myself: "your",
  son: "your son's",
  daughter: "your daughter's",
  brother: "your brother's",
  sister: "your sister's",
  friend: "your friend's",
  relative: "your relative's",
  other: "the person's",
};

function personLabel(createdFor: string): string {
  return PROFILE_PERSON_LABEL[createdFor] ?? "their";
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

const MOTHER_TONGUES = [
  "English","Hindi","Bengali","Tamil","Telugu","Marathi","Gujarati","Kannada",
  "Malayalam","Punjabi","Urdu","Odia","Assamese","Sinhala","Nepali",
  "Arabic","Spanish","French","Portuguese","Mandarin","Japanese","Korean",
  "German","Russian","Italian","Turkish","Other",
];

const INTEREST_OPTIONS = [
  "Reading","Music","Movies","Travel","Cooking","Photography","Sports","Fitness",
  "Yoga","Meditation","Painting","Writing","Dancing","Singing","Gardening",
  "Gaming","Technology","Volunteering","Spirituality","Pets","Nature","Fashion",
];

const INCOME_BRACKETS = [
  "Prefer not to say",
  "No income / Dependent",
  "Under 2 LPA",
  "2 – 5 LPA",
  "5 – 10 LPA",
  "10 – 20 LPA",
  "20 – 50 LPA",
  "50 LPA+",
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState<FormState>({
    created_for: "",
    guardian_name: "",
    guardian_relation: "",
    guardian_phone: "",
    guardian_email: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    disability_category: "",
    disability_percentage: 40,
    religion: "",
    mother_tongue: "",
    marital_status: "",
    education: "",
    occupation: "",
    employment_type: "",
    city: "",
    state: "",
    country: "",
    about: "",
    partner_preferences: "",
    interests: [],
    custom_interest: "",
    habits: DEFAULT_HABITS,
    family_details: "",
    annual_income: "",
    partner_min_age: undefined,
    partner_max_age: undefined,
    partner_about: "",
  });

  const isIndia = form.country === "India";
  const createdForOptions = isIndia
    ? CREATED_FOR_OPTIONS
    : CREATED_FOR_OPTIONS.filter((o) =>
        ["myself", "friend", "relative", "other"].includes(o.value),
      );

  // If user is outside India and somehow has a family-relation selected, reset it.
  useEffect(() => {
    if (
      !isIndia &&
      ["son", "daughter", "brother", "sister"].includes(form.created_for)
    ) {
      setForm((f) => ({ ...f, created_for: "myself" }));
    }
  }, [isIndia, form.created_for]);

  const isForSelf = form.created_for === "myself";
  const STEP_KEYS = isForSelf
    ? ["for-whom", "basics", "disability", "background", "about"]
    : ["for-whom", "guardian", "basics", "disability", "background", "about"];
  const creatorLabel =
    form.created_for === "son" || form.created_for === "daughter"
      ? "Parent details"
      : form.created_for === "brother" || form.created_for === "sister"
        ? "Sibling details"
      : form.created_for === "friend"
        ? "Friend's details"
        : form.created_for === "relative"
          ? "Relative's details"
          : "Your details";
  const STEPS = isForSelf
    ? ["For whom", "Basics", "Disability", "Background", "About"]
    : ["For whom", creatorLabel, "Profile basics", "Disability", "Background", "About"];
  const guardianStep = isForSelf ? -1 : 1;
  const basicsStep = isForSelf ? 1 : 2;
  const disabilityStep = isForSelf ? 2 : 3;
  const backgroundStep = isForSelf ? 3 : 4;
  const aboutStep = isForSelf ? 4 : 5;

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          created_for: (data as { created_for?: string | null }).created_for ?? "",
          guardian_name: (data as { guardian_name?: string | null }).guardian_name ?? "",
          guardian_relation: (data as { guardian_relation?: string | null }).guardian_relation ?? "",
          guardian_phone: (data as { guardian_phone?: string | null }).guardian_phone ?? "",
          guardian_email: (data as { guardian_email?: string | null }).guardian_email ?? "",
          full_name: data.full_name ?? "",
          gender: data.gender ?? "",
          date_of_birth: data.date_of_birth ?? "",
          disability_category: data.disability_category ?? "",
          disability_percentage: data.disability_percentage ?? 40,
          religion: data.religion ?? "",
          mother_tongue: data.mother_tongue ?? "",
          marital_status: data.marital_status ?? "",
          education: data.education ?? "",
          occupation: data.occupation ?? "",
          employment_type: (data as { employment_type?: string | null }).employment_type ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          about: data.about ?? "",
          partner_preferences: data.partner_preferences ?? "",
          interests: (data as { interests?: string[] | null }).interests ?? [],
          custom_interest: "",
          habits: { ...DEFAULT_HABITS, ...(((data as { habits?: HabitsState | null }).habits) ?? {}) },
          family_details: (data as { family_details?: string | null }).family_details ?? "",
          annual_income: (data as { annual_income?: string | null }).annual_income ?? "",
          partner_min_age: (data as { partner_min_age?: number | null }).partner_min_age ?? undefined,
          partner_max_age: (data as { partner_max_age?: number | null }).partner_max_age ?? undefined,
          partner_about: (data as { partner_about?: string | null }).partner_about ?? "",
        }));
        // resume at the step the user left off on
        const savedStep = (data as { onboarding_step?: number | null }).onboarding_step ?? 0;
        if (typeof savedStep === "number" && savedStep > 0) {
          setStep((s) => Math.max(s, savedStep));
        }
      });
  }, [user]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const next = () => {
    const stepErrors = validateStep(form, isForSelf, STEP_KEYS[step]);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      const first = Object.values(stepErrors)[0];
      if (first) toast.error(first);
      return;
    }
    setErrors({});
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    setStep(nextStep);
    if (user) {
      supabase
        .from("profiles")
        .update({ onboarding_step: nextStep })
        .eq("id", user.id)
        .then(() => {});
    }
  };
  const prev = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({
      created_for: parsed.data.created_for,
      guardian_name: parsed.data.guardian_name || null,
      guardian_relation: parsed.data.guardian_relation || null,
      guardian_phone: parsed.data.guardian_phone || null,
      guardian_email: parsed.data.guardian_email || null,
      full_name: parsed.data.full_name,
      gender: parsed.data.gender,
      date_of_birth: parsed.data.date_of_birth,
      disability_category: parsed.data.disability_category,
      disability_percentage: parsed.data.disability_percentage,
      religion: parsed.data.religion || null,
      mother_tongue: parsed.data.mother_tongue || null,
      marital_status: parsed.data.marital_status,
      education: parsed.data.education || null,
      occupation: parsed.data.occupation || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      country: parsed.data.country || null,
      about: parsed.data.about || null,
      partner_preferences: parsed.data.partner_preferences || null,
      interests: (() => {
        const list = [...(parsed.data.interests ?? [])];
        const custom = (parsed.data.custom_interest ?? "").trim();
        if (custom) {
          custom.split(",").map((s) => s.trim()).filter(Boolean).forEach((c) => {
            if (!list.includes(c)) list.push(c);
          });
        }
        return list.length ? list : null;
      })(),
      habits: parsed.data.habits as unknown as never,
      family_details: parsed.data.family_details || null,
      annual_income: parsed.data.annual_income || null,
      partner_min_age: parsed.data.partner_min_age ?? null,
      partner_max_age: parsed.data.partner_max_age ?? null,
      partner_about: parsed.data.partner_about || null,
      is_profile_complete: true,
    }).eq("id", user.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved!");
    navigate({ to: "/under-review" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl">{STEPS[step]}</h1>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        Step {step + 1} of {STEPS.length} — {Math.round(((step + 1) / STEPS.length) * 100)}% complete
      </p>

      <div className="mt-4 flex items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
        {STEPS.map((label, i) => {
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`flex items-center justify-center gap-1 rounded-full text-xs font-medium transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground h-7 w-7 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
                    : isCurrent
                      ? "bg-primary/10 text-primary ring-1 ring-primary h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
                      : "bg-muted text-muted-foreground h-7 w-7 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
                }`}
                title={label}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] sm:text-xs">{i + 1}</span>
                )}
                <span className="hidden whitespace-nowrap sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-3 rounded-full sm:w-4 ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
        {step === 0 && (
          <>
            <Field label="This profile is being created for" error={errors.created_for}>
              <Select value={form.created_for} onValueChange={(v) => set("created_for", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {createdForOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose who this account is for. If it's not you, we'll first ask
                for <strong>your</strong> contact details, then the profile
                person's details.
              </p>
            </Field>

            {form.created_for && !isForSelf && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Quick start — tell us a bit about {personLabel(form.created_for)}{" "}
                  basics. You can add more details on the next steps.
                </p>
                <Field
                  label={`Please enter ${personLabel(form.created_for)} full name`}
                  error={errors.full_name}
                >
                  <Input
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder={`e.g. ${form.created_for === "son" ? "Rahul" : form.created_for === "daughter" ? "Priya" : "Full name"}`}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {step === guardianStep && !isForSelf && (
          <>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">
                Step {step + 1}: About you (the person creating this profile)
              </p>
              <p className="mt-1 text-muted-foreground">
                {RELATION_LABEL[form.created_for] ?? "Your details"} — we need this so the
                profile person and matches can reach you.
              </p>
            </div>
            <Field label="Your full name" required error={errors.guardian_name}>
              <Input value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} />
            </Field>
            <Field label="Your relation to the person" required error={errors.guardian_relation}>
              <Select value={form.guardian_relation}
                onValueChange={(v) => set("guardian_relation", v)}>
                <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                <SelectContent>
                  {(RELATION_OPTIONS[form.created_for] ?? ["Other"]).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Your phone number" required error={errors.guardian_phone}>
              <Input inputMode="tel" value={form.guardian_phone}
                onChange={(e) => set("guardian_phone", e.target.value)}
                placeholder="Include country code, e.g. +1 5551234567" />
            </Field>
            <Field label="Your email" required error={errors.guardian_email}>
              <Input type="email" value={form.guardian_email}
                onChange={(e) => set("guardian_email", e.target.value)}
                placeholder="you@example.com" />
            </Field>
          </>
        )}

        {step === basicsStep && (
          <>
            {!isForSelf && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">
                  Step {step + 1}: About {personLabel(form.created_for)} profile
                </p>
                <p className="mt-1 text-muted-foreground">
                  These details will appear on the profile shown to matches.
                </p>
              </div>
            )}
            <Field
              label={
                isForSelf
                  ? "Full name"
                  : `Please enter ${personLabel(form.created_for)} full name`
              }
              required
              error={errors.full_name}
            >
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </Field>
            <Field
              label={isForSelf ? "Gender" : `${capitalize(personLabel(form.created_for))} gender`}
              required
              error={errors.gender}
            >
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={isForSelf ? "Date of birth" : `${capitalize(personLabel(form.created_for))} date of birth`}
              required
              error={errors.date_of_birth}
            >
              <Input type="date" value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)} />
            </Field>
            <Field
              label={isForSelf ? "Marital status" : `${capitalize(personLabel(form.created_for))} marital status`}
              required
              error={errors.marital_status}
            >
              <Select value={form.marital_status} onValueChange={(v) => set("marital_status", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {step === disabilityStep && (
          <>
            <Field label="Disability category" required error={errors.disability_category}>
              <Select value={form.disability_category}
                onValueChange={(v) => set("disability_category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {DISABILITY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Disability percentage (0–100%)" required error={errors.disability_percentage}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  value={form.disability_percentage}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isNaN(n)) return;
                    set("disability_percentage", Math.max(0, Math.min(100, Math.round(n))));
                  }}
                  className="w-32"
                  aria-label="Disability percentage"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Type the percentage as mentioned in your disability certificate.
              </p>
            </Field>
          </>
        )}

        {step === backgroundStep && (
          <>
            <Field label="Religion">
              <Select value={form.religion} onValueChange={(v) => set("religion", v)}>
                <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
                <SelectContent>
                  {RELIGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mother tongue">
              <Select value={form.mother_tongue} onValueChange={(v) => set("mother_tongue", v)}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {MOTHER_TONGUES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Education">
              <Select value={form.education} onValueChange={(v) => set("education", v)}>
                <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Employment type">
              <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select employment type" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Occupation / Job title">
              <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)}
                placeholder="e.g. Teacher, Software Engineer" />
            </Field>
            <Field label={isForSelf ? "Annual income" : `${capitalize(personLabel(form.created_for))} annual income`}>
              <Select value={form.annual_income} onValueChange={(v) => set("annual_income", v)}>
                <SelectTrigger><SelectValue placeholder="Select income range" /></SelectTrigger>
                <SelectContent>
                  {INCOME_BRACKETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={isForSelf ? "Family details" : `${capitalize(personLabel(form.created_for))} family details`}>
              <Textarea
                rows={3}
                value={form.family_details}
                onChange={(e) => set("family_details", e.target.value)}
                placeholder="e.g. Parents, siblings, family background, values…"
              />
            </Field>

            <LocationPicker
              value={{ country: form.country, state: form.state, city: form.city }}
              onChange={(v) => {
                set("country", v.country);
                set("state", v.state);
                set("city", v.city);
              }}
            />

          </>
        )}

        {step === aboutStep && (
          <>
            <Field label={isForSelf ? "About you" : `About ${personLabel(form.created_for).replace(/'s$/, "")}`}>
              <Textarea rows={4} value={form.about}
                onChange={(e) => set("about", e.target.value)}
                placeholder={isForSelf ? "A few lines about yourself…" : "A few lines about them…"} />
            </Field>

            <Field label={isForSelf ? "Your interests & hobbies" : `${capitalize(personLabel(form.created_for))} interests & hobbies`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INTEREST_OPTIONS.map((opt) => {
                  const checked = form.interests.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors ${
                        checked ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = v === true;
                          set(
                            "interests",
                            on
                              ? [...form.interests, opt]
                              : form.interests.filter((x) => x !== opt),
                          );
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              <Input
                value={form.custom_interest}
                onChange={(e) => set("custom_interest", e.target.value)}
                placeholder="Add your own (comma separated) — e.g. Astronomy, Chess"
                className="mt-2"
              />
            </Field>

            <Field label={isForSelf ? "Lifestyle habits" : `${capitalize(personLabel(form.created_for))} lifestyle habits`}>
              <div className="space-y-3">
                <HabitRow
                  label="Drinks alcohol?"
                  value={form.habits.drinks}
                  detail={form.habits.drinks_detail}
                  detailPlaceholder="e.g. Occasionally, socially…"
                  onChange={(v, d) => set("habits", { ...form.habits, drinks: v, drinks_detail: d })}
                />
                <HabitRow
                  label="Smokes?"
                  value={form.habits.smokes}
                  detail={form.habits.smokes_detail}
                  detailPlaceholder="e.g. Rarely, only on weekends…"
                  onChange={(v, d) => set("habits", { ...form.habits, smokes: v, smokes_detail: d })}
                />
                <HabitRow
                  label="Any other habits/vices?"
                  value={form.habits.other}
                  detail={form.habits.other_detail}
                  detailPlaceholder="Describe (e.g. tobacco, gambling, etc.)"
                  onChange={(v, d) => set("habits", { ...form.habits, other: v, other_detail: d })}
                />
              </div>
            </Field>

            <Field label="Preferred partner age range">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={99}
                  placeholder="Min"
                  value={form.partner_min_age ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("partner_min_age", v === "" ? undefined : Math.max(18, Math.min(99, Number(v))));
                  }}
                  className="w-24"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={99}
                  placeholder="Max"
                  value={form.partner_max_age ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("partner_max_age", v === "" ? undefined : Math.max(18, Math.min(99, Number(v))));
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">years</span>
              </div>
            </Field>

            <Field label="About the ideal partner">
              <Textarea
                rows={4}
                value={form.partner_about}
                onChange={(e) => set("partner_about", e.target.value)}
                placeholder="Personality, values, lifestyle, anything important…"
              />
            </Field>

            <Field label="What you're looking for in a partner (short summary)">
              <Textarea rows={4} value={form.partner_preferences}
                onChange={(e) => set("partner_preferences", e.target.value)}
                placeholder="Describe your ideal companion…" />
            </Field>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="rounded-xl">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl">
            {submitting ? "Saving…" : <>Save profile <Check className="ml-2 h-4 w-4" /></>}
          </Button>
        )}
      </div>
    </main>
  );
}

function Field({
  label, children, required, error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function HabitRow({
  label, value, detail, detailPlaceholder, onChange,
}: {
  label: string;
  value: "" | "yes" | "no";
  detail: string;
  detailPlaceholder: string;
  onChange: (value: "" | "yes" | "no", detail: string) => void;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Select value={value} onValueChange={(v) => onChange(v as "yes" | "no", v === "yes" ? detail : "")}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value === "yes" && (
        <Input
          className="mt-2"
          value={detail}
          onChange={(e) => onChange("yes", e.target.value)}
          placeholder={detailPlaceholder}
        />
      )}
    </div>
  );
}
