import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/lib/use-app-settings";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — United Disabled Matrimony" }] }),
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function SignupPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/onboarding" });
  }, [loading, session, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings.signups_enabled) {
      toast.error("New signups are paused. Please check back later.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the Terms, Privacy Policy and Data Protection Notice to continue.");
      return;
    }
    const parsed = schema.safeParse({ full_name: fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: parsed.data.full_name },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Let's set up your profile.");
    navigate({ to: "/onboarding" });
  };

  const handleGoogle = async () => {
    if (!settings.signups_enabled) {
      toast.error("New signups are paused. Please check back later.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the Terms, Privacy Policy and Data Protection Notice to continue.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/onboarding" },
    });
    if (error) toast.error(error.message ?? "Google sign-in failed");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" aria-label="United Disabled Matrimony — home" className="flex justify-center">
          <BrandLogo variant="full" className="max-w-[220px]" />
        </Link>
        <h1 className="mt-6 font-display text-3xl">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A respectful matrimonial space — built for you.
        </p>

        {!settings.signups_enabled && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            New signups are paused right now. Please check back later.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" required value={fullName}
              onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span>
              I confirm I am at least <strong>18 years old</strong> and I agree to United Disabled Matrimony's{" "}
              <Link to="/terms" className="text-foreground underline">Terms &amp; Conditions</Link>,{" "}
              <Link to="/privacy" className="text-foreground underline">Privacy Policy</Link> and{" "}
              <Link to="/data-protection" className="text-foreground underline">Data Protection Notice</Link>.
            </span>
          </label>
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={submitting || !agreed}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="h-11 w-full rounded-xl" onClick={handleGoogle} disabled={!agreed}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
