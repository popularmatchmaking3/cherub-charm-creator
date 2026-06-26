import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Ear,
  MessageCircle,
  Accessibility,
  Brain,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import heroImage from "@/assets/hero-couple.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "United Disabled Matrimony — United Disabled Matrimony" },
      { name: "description", content: "A respectful matrimonial platform for people with disabilities. Find a life partner who understands you." },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { id: "visual", label: "Visually Impaired", Icon: Eye },
  { id: "hearing", label: "Hearing Impaired", Icon: Ear },
  { id: "speech", label: "Speech Impaired", Icon: MessageCircle },
  { id: "locomotor", label: "Locomotor Disability", Icon: Accessibility },
  { id: "intellectual", label: "Intellectual Disability", Icon: Brain },
  { id: "multiple", label: "Multiple Disabilities", Icon: HeartHandshake },
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl">United Disabled Matrimony</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            United Disabled Matrimony
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/vision" className="hover:text-foreground">Vision</Link>
          <Link to="/testimonials" className="hover:text-foreground">Stories</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline" className="rounded-full">Sign in</Button>
          </Link>
          <Link to="/signup" className="hidden sm:inline-flex">
            <Button className="rounded-full">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-12 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Built with care
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
            Love that<br />
            <em className="font-display italic text-primary">understands</em> you.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            United Disabled Matrimony is a respectful matrimonial space for the differently-abled
            community — visually impaired, hearing impaired, speech impaired,
            locomotor and more. Real profiles. Real companionship.
          </p>

          {/* Value props + CTA */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ul className="space-y-3 text-sm">
              {[
                "Real profiles, reviewed by our team",
                "Private chat — only after mutual interest",
                "Available globally, designed for accessibility",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="mt-6 block">
              <Button className="h-12 w-full rounded-xl text-base">
                Create your free profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free to join. No spam. Ever.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-accent/40 blur-2xl" />
          <img
            src={heroImage}
            alt="A joyful couple holding hands at golden hour"
            width={1536}
            height={1280}
            className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl"
          />
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-lg md:block">
            <p className="font-display text-3xl text-primary">12,000+</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              hopeful members
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Who we serve
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Every kind of journey,<br />welcomed here.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(({ id, label, Icon }) => (
              <div
                key={id}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/40 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 font-display text-2xl">{label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Profiles, preferences and matches tailored for the {label.toLowerCase()} community.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Three quiet steps to a meaningful match.
            </h2>
          </div>
          <ol className="space-y-10">
            {[
              {
                t: "Create your profile",
                d: "Share who you are, your category and percentage of disability — and what makes you, you.",
              },
              {
                t: "Set your preferences",
                d: "Tell us what kind of partner you hope to meet. Religion, language, lifestyle, accessibility needs.",
              },
              {
                t: "Meet, on your terms",
                d: "Browse profiles and connect privately. No pressure, no spam, ever.",
              },
            ].map((s, i) => (
              <li key={s.t} className="grid grid-cols-[auto_1fr] gap-6 border-t border-border pt-6">
                <span className="font-display text-4xl text-primary">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-display text-2xl">{s.t}</p>
                  <p className="mt-2 max-w-md text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Stories
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            Companions, found.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                q: "We met here, talked for months, and married last spring. United Disabled Matrimony understood what other apps couldn't.",
                n: "Aarti & Ramesh",
                m: "Visually impaired · Locomotor",
              },
              {
                q: "Honest profiles. Kind people. I never felt I had to explain myself before being seen.",
                n: "Faisal & Noor",
                m: "Hearing impaired · Hearing impaired",
              },
            ].map((s) => (
              <figure
                key={s.n}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <blockquote className="font-display text-2xl leading-snug">
                  &ldquo;{s.q}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm text-muted-foreground">
                  <span className="text-foreground">{s.n}</span> · {s.m}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-12 text-center md:p-20">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-4xl md:text-6xl">
            Your story begins<br />with a single hello.
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Free to join. Real profiles. Privacy you can trust.
          </p>
          <Link to="/signup" className="mt-8">
            <Button className="h-12 rounded-full px-8 text-base">
              Create your profile
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">United Disabled Matrimony</p>
            <p className="mt-2">Respectful matrimonial space for the differently-abled, worldwide.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/vision" className="hover:text-foreground">Vision</Link>
            <Link to="/testimonials" className="hover:text-foreground">Stories</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
          <p className="md:text-right">© {new Date().getFullYear()} United Disabled Matrimony. Made with care.</p>
        </div>
      </footer>
    </main>
  );
}
