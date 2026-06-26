import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, BadgeCheck, Clock, AlertCircle, Upload, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({ meta: [{ title: "Verification status — United Disabled Matrimony" }] }),
  component: VerificationPage,
});

type VerifStatus = "none" | "pending" | "verified" | "rejected";

interface VerifData {
  is_verified: boolean;
  disability_verified: boolean;
  id_verification_status: VerifStatus;
  id_verification_submitted_at: string | null;
  id_verification_note: string | null;
  disability_verification_status: VerifStatus;
  disability_verification_submitted_at: string | null;
  disability_verification_note: string | null;
}

function VerificationPage() {
  const { user } = useAuth();
  const [v, setV] = useState<VerifData | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "is_verified, disability_verified, id_verification_status, id_verification_submitted_at, id_verification_note, disability_verification_status, disability_verification_submitted_at, disability_verification_note",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setV(data as unknown as VerifData);
      });
  }, [user]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to settings
      </Link>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">Verification</p>
      <h1 className="mt-2 font-display text-4xl">Verification status</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        See exactly where each of your documents is in the review process. Uploads happen from <Link to="/settings" className="underline">Settings</Link>.
      </p>

      <Track
        title="Identity (Govt ID)"
        verified={v?.is_verified ?? false}
        status={v?.id_verification_status ?? "none"}
        submittedAt={v?.id_verification_submitted_at ?? null}
        note={v?.id_verification_note ?? null}
      />

      <Track
        title="Disability proof"
        verified={v?.disability_verified ?? false}
        status={v?.disability_verification_status ?? "none"}
        submittedAt={v?.disability_verification_submitted_at ?? null}
        note={v?.disability_verification_note ?? null}
        optional
      />
    </main>
  );
}

function Track({
  title, verified, status, submittedAt, note, optional,
}: {
  title: string;
  verified: boolean;
  status: VerifStatus;
  submittedAt: string | null;
  note: string | null;
  optional?: boolean;
}) {
  const steps: { key: string; label: string; done: boolean; current?: boolean; failed?: boolean }[] = [
    { key: "submitted", label: "Document submitted", done: status !== "none" },
    {
      key: "review",
      label: "Under admin review",
      done: status === "verified" || status === "rejected",
      current: status === "pending",
    },
    {
      key: "result",
      label: status === "rejected" ? "Rejected" : "Verified",
      done: status === "verified",
      failed: status === "rejected",
    },
  ];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {title}
            {optional && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Optional</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {submittedAt
              ? `Submitted ${new Date(submittedAt).toLocaleString()}`
              : "Not submitted yet"}
          </p>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        ) : status === "rejected" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            <AlertCircle className="h-3 w-3" /> Rejected
          </span>
        ) : status === "pending" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <Clock className="h-3 w-3" /> Under review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Upload className="h-3 w-3" /> Not submitted
          </span>
        )}
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={s.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                s.failed
                  ? "bg-destructive text-destructive-foreground"
                  : s.done
                    ? "bg-primary text-primary-foreground"
                    : s.current
                      ? "bg-amber-500 text-white"
                      : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${s.done || s.current ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </p>
              {s.failed && note && (
                <p className="mt-1 text-xs text-destructive">Reason: {note}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {status === "rejected" && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          You can upload a corrected document — it will automatically replace the previous one.
        </p>
      )}
    </section>
  );
}