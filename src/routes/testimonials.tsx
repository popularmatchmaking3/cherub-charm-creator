import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Stories from our members — United Disabled Matrimony" },
      { name: "description", content: "Real stories from members of the United Disabled Matrimony community who found companionship and love." },
      { property: "og:title", content: "Stories — United Disabled Matrimony" },
      { property: "og:description", content: "Real stories from members who found their companion on United Disabled Matrimony." },
    ],
  }),
  component: TestimonialsPage,
});

const STORIES = [
  { q: "We met here, talked for months, and married last spring. United Disabled Matrimony understood what other apps couldn't.", n: "Aarti & Ramesh", m: "Visually impaired · Locomotor", c: "India" },
  { q: "Honest profiles. Kind people. I never felt I had to explain myself before being seen.", n: "Faisal & Noor", m: "Hearing impaired · Hearing impaired", c: "UAE" },
  { q: "The verification gave me real confidence. I knew the person I spoke to was who they said they were.", n: "Priya & Karan", m: "Locomotor · Speech impaired", c: "Canada" },
  { q: "I joined hoping for friendship and found my partner. Forever grateful.", n: "Sara & Daniel", m: "Visually impaired · Intellectual", c: "United Kingdom" },
  { q: "Accessibility was built in — screen readers, big buttons, clear text. It just worked.", n: "Imran & Zoya", m: "Visually impaired · Visually impaired", c: "India" },
  { q: "We bonded over our shared journeys. We&apos;re engaged now.", n: "Megha & Rohit", m: "Hearing impaired · Locomotor", c: "Australia" },
];

function TestimonialsPage() {
  return (
    <SitePage>
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Stories</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">Companions, found.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Real members. Real journeys. Some names have been changed for privacy.
        </p>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2">
          {STORIES.map((s, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-card p-8">
              <blockquote className="font-display text-2xl leading-snug">&ldquo;{s.q}&rdquo;</blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground">
                <span className="text-foreground">{s.n}</span> · {s.m} · {s.c}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl md:text-4xl">Your story could be next.</h2>
        <Link to="/signup" className="mt-6 inline-block">
          <Button className="h-12 rounded-full px-8">Join United Disabled Matrimony</Button>
        </Link>
      </section>
    </SitePage>
  );
}