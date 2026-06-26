import { createFileRoute } from "@tanstack/react-router";
import { Heart, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — United Disabled Matrimony" },
      { name: "description", content: "Rules to keep United Disabled Matrimony safe and respectful for everyone." },
      { property: "og:title", content: "Community Guidelines — United Disabled Matrimony" },
      { property: "og:description", content: "Rules to keep United Disabled Matrimony safe and respectful for everyone." },
    ],
  }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Trust &amp; safety</p>
      <h1 className="mt-2 font-display text-4xl">Community guidelines</h1>
      <p className="mt-3 text-muted-foreground">
        United Disabled Matrimony is a safe, respectful and honest community. Every member is expected to follow these rules.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl">Respect &amp; dignity</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <Item ok>Use polite language, even if it isn't a match.</Item>
          <Item ok>Talk about disability sensitively and respectfully.</Item>
          <Item ok>Respect "no" — never pressure another member.</Item>
          <Item bad>Abusive, casteist or body-shaming language is strictly forbidden.</Item>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl">Honesty &amp; authenticity</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <Item ok>Use your real photo, real name and accurate details.</Item>
          <Item ok>Be truthful about marital status, age and education.</Item>
          <Item bad>Fake profiles, using someone else's photo or impersonation will lead to a ban.</Item>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="font-display text-xl">Strictly prohibited</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <Item bad>Asking for money or gifts, or any financial scam.</Item>
          <Item bad>Sexually explicit messages, nude photos or unsolicited intimate content.</Item>
          <Item bad>Blackmail, threats or harassment.</Item>
          <Item bad>Anyone under 18 years of age.</Item>
          <Item bad>Spam, marketing or promoting external services.</Item>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Reporting &amp; action</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Saw someone break these rules? Report them from the three-dot menu (⋮) on their profile. The admin team reviews reports within 24–48 hours. Serious cases may result in an immediate account suspension.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Blocking a member only hides them from you — they remain on the app but will no longer be visible to you.
        </p>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Breaking these guidelines may result in a warning, temporary suspension or permanent ban. The final decision rests with the United Disabled Matrimony admin team.
      </p>
    </main>
  );
}

function Item({ children, ok, bad }: { children: React.ReactNode; ok?: boolean; bad?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {ok && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />}
      {bad && <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />}
      <span>{children}</span>
    </li>
  );
}