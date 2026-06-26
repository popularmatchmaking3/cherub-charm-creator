import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SitePage } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/appeal")({
  head: () => ({
    meta: [
      { title: "Appeal a suspension — United Disabled Matrimony" },
      { name: "description", content: "Submit an appeal if your United Disabled Matrimony account has been suspended or restricted." },
      { property: "og:title", content: "Appeal a suspension — United Disabled Matrimony" },
      { property: "og:description", content: "Submit an appeal if your account has been suspended or restricted." },
    ],
  }),
  component: AppealPage,
});

function AppealPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !details.trim()) {
      toast.error("Please fill in name, email and your appeal details.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("appeals").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      reason: reason.trim() || null,
      details: details.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Appeal submitted. Our team will review it.");
  };

  return (
    <SitePage>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Account appeal</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Appeal a suspension</h1>
        <p className="mt-4 text-muted-foreground">
          If your account has been suspended, restricted or terminated and you
          believe this was a mistake, you can submit an appeal here. Our
          moderation team reviews appeals within 7 business days.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="font-display text-2xl">Thanks — appeal received.</p>
            <p className="mt-2 text-muted-foreground">
              We&apos;ve recorded your appeal and will get back to you on the email you provided.
            </p>
            <Link to="/" className="mt-6 inline-block underline">Back to home</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="ap-name">Full name</Label>
              <Input id="ap-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ap-email">Email on the account</Label>
                <Input id="ap-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-phone">Phone (optional)</Label>
                <Input id="ap-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-reason">Reason given for action (if known)</Label>
              <Input id="ap-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Suspended for policy violation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-details">Your appeal</Label>
              <Textarea id="ap-details" rows={6} value={details} onChange={(e) => setDetails(e.target.value)} required placeholder="Explain why the action should be reviewed. Add any context that helps us." />
            </div>
            <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl">
              {submitting ? "Submitting…" : "Submit appeal"}
            </Button>
            <p className="text-xs text-muted-foreground">
              By submitting you confirm the information is true. False appeals
              may lead to permanent termination. See our{" "}
              <Link to="/terms" className="underline">Terms</Link> and{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        )}
      </section>
    </SitePage>
  );
}