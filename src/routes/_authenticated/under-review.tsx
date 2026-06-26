import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useReviewStatus } from "@/lib/use-review-status";
import { useAppSettings } from "@/lib/use-app-settings";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, CheckCircle2, LogOut, LifeBuoy, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/under-review")({
  head: () => ({ meta: [{ title: "Account under review — United Disabled Matrimony" }] }),
  component: UnderReviewPage,
});

function UnderReviewPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { loading, status, notes, isProfileComplete } = useReviewStatus();
  const settings = useAppSettings();

  // If approved, kick them into the app.
  useEffect(() => {
    if (status === "approved") {
      const t = setTimeout(() => navigate({ to: "/dashboard" }), 1200);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading…
      </main>
    );
  }

  const isRejected = status === "rejected";
  const isApproved = status === "approved";
  const Icon = isApproved ? CheckCircle2 : isRejected ? ShieldAlert : Clock;
  const title = isApproved
    ? "Account approved"
    : isRejected
      ? "Account not approved"
      : "Account under review";
  const message = isApproved
    ? settings.review_approved_welcome
    : isRejected
      ? settings.review_rejected_message
      : settings.review_pending_message;
  const iconClass = isApproved
    ? "text-emerald-600"
    : isRejected
      ? "text-destructive"
      : "text-amber-600";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Icon className={`mx-auto h-12 w-12 ${iconClass}`} />
        <h1 className="mt-4 font-display text-3xl">{title}</h1>
        <p className="mt-3 whitespace-pre-line text-muted-foreground">{message}</p>

        {!isProfileComplete && !isRejected && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left text-sm">
            <p className="font-medium">Apni profile complete karein</p>
            <p className="mt-1 text-muted-foreground">
              Review tabhi hogi jab aapki profile fully bhari hui ho.
            </p>
            <Button asChild className="mt-3 rounded-full">
              <Link to="/onboarding">Continue profile setup</Link>
            </Button>
          </div>
        )}

        {isRejected && notes && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left text-sm">
            <p className="font-medium text-destructive">Reviewer note</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{notes}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isRejected && (
            <Button asChild className="rounded-full">
              <Link to="/appeal">
                <LifeBuoy className="mr-2 h-4 w-4" /> File an appeal
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/settings">
              <SettingsIcon className="mr-2 h-4 w-4" /> Settings
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}