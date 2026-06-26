import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings } from "@/lib/use-app-settings";
import { toast } from "sonner";
import { Crown, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/membership")({
  head: () => ({ meta: [{ title: "Membership — United Disabled Matrimony" }] }),
  component: MembershipPage,
});

interface Mine {
  membership_tier: "free" | "premium";
  membership_expires_at: string | null;
}

function MembershipPage() {
  const { user } = useAuth();
  const settings = useAppSettings();
  const [mine, setMine] = useState<Mine | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!settings.membership_enabled) {
      // Membership is disabled — kick back to dashboard
      navigate({ to: "/dashboard" });
    }
  }, [settings.membership_enabled, navigate]);

  if (!settings.membership_enabled) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl">Membership free hai</h1>
        <p className="mt-3 text-muted-foreground">
          Abhi sab features bilkul free hain. Koi membership zaroori nahi.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary hover:underline">
          Browse profiles →
        </Link>
      </main>
    );
  }

  async function load() {
    if (!user) return;
    const [{ data: p }, { data: req }] = await Promise.all([
      supabase.from("profiles").select("membership_tier, membership_expires_at")
        .eq("id", user.id).maybeSingle(),
      supabase.from("membership_requests").select("id").eq("user_id", user.id)
        .eq("status", "pending").maybeSingle(),
    ]);
    setMine(p as Mine);
    setPending(!!req);
  }
  useEffect(() => { load(); }, [user]);

  async function request() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("membership_requests")
      .insert({ user_id: user.id, requested_tier: "premium", note: note || null });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent to admin");
    setNote("");
    load();
  }

  const benefits = [
    "Unlimited interests per day",
    "Start chats with anyone matched",
    "See who viewed your profile",
    "Verified premium badge",
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Membership</p>
      <h1 className="mt-2 font-display text-4xl">Your plan</h1>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 font-display text-2xl">
          <Crown className="h-5 w-5 text-primary" />
          {mine?.membership_tier === "premium" ? "Premium" : "Free"}
        </p>
        {mine?.membership_tier === "premium" && mine.membership_expires_at && (
          <p className="mt-1 text-sm text-muted-foreground">
            Active until {new Date(mine.membership_expires_at).toLocaleDateString()}
          </p>
        )}
        <ul className="mt-4 space-y-2 text-sm">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>

      {mine?.membership_tier !== "premium" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Request Premium upgrade</h2>
          {!settings.payments_enabled && (
            <p className="mt-1 text-sm text-muted-foreground">
              Online payments are not enabled yet. An admin will approve your request manually.
            </p>
          )}
          {pending ? (
            <p className="mt-4 rounded-xl bg-secondary p-4 text-sm">
              Your request is pending. An admin will review it shortly.
            </p>
          ) : (
            <>
              <Textarea className="mt-3" rows={3} maxLength={500}
                placeholder="Optional: any note for the admin?"
                value={note} onChange={(e) => setNote(e.target.value)} />
              <Button className="mt-3 rounded-full" disabled={submitting} onClick={request}>
                {submitting ? "Sending…" : "Request Premium"}
              </Button>
            </>
          )}
        </div>
      )}
    </main>
  );
}