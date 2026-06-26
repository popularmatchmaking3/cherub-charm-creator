import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Globe2, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About United Disabled Matrimony — A matrimonial space built with empathy" },
      { name: "description", content: "United Disabled Matrimony is a respectful matrimonial platform built for the differently-abled community across the world." },
      { property: "og:title", content: "About United Disabled Matrimony" },
      { property: "og:description", content: "A respectful matrimonial platform for the differently-abled, worldwide." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { Icon: Heart, t: "Built with empathy", d: "Every decision starts with the people we serve — their dignity, time and comfort come first." },
  { Icon: ShieldCheck, t: "Privacy by default", d: "Profiles stay private. Chat and call only unlock after both members say yes." },
  { Icon: Globe2, t: "Global, by design", d: "Members from across the world join United Disabled Matrimony. We support multiple countries, languages and access needs." },
  { Icon: Users, t: "Community first", d: "We work closely with disability advocates to keep the experience inclusive and safe." },
];

function AboutPage() {
  return (
    <SitePage>
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">About us</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">A matrimonial space, made with care.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          United Disabled Matrimony was born from a simple belief — that everyone, regardless of ability,
          deserves to find a life partner who truly understands them. We are a small,
          dedicated team building a respectful, accessible matrimonial space for the
          differently-abled community across the world.
        </p>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2">
          {VALUES.map(({ Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/40 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 font-display text-2xl">{t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl md:text-4xl">Join a community that gets you.</h2>
        <Link to="/signup" className="mt-6 inline-block">
          <Button className="h-12 rounded-full px-8">Create your free profile</Button>
        </Link>
      </section>
    </SitePage>
  );
}