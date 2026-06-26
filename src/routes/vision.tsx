import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vision")({
  head: () => ({
    meta: [
      { title: "Our Vision — United Disabled Matrimony" },
      { name: "description", content: "A world where every differently-abled person can find love, companionship and respect, without barriers." },
      { property: "og:title", content: "Our Vision — United Disabled Matrimony" },
      { property: "og:description", content: "Love and companionship for everyone, everywhere — without barriers." },
    ],
  }),
  component: VisionPage,
});

function VisionPage() {
  return (
    <SitePage>
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Our vision</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">A world without barriers to love.</h1>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            We imagine a future where finding a life partner is never harder
            because of a disability. A future where matrimonial platforms are
            built <em>for</em> the differently-abled — not as an afterthought.
          </p>
          <p>
            United Disabled Matrimony is our small contribution to that future. We&apos;re building
            a global, accessible, kind home for people seeking real
            companionship — across countries, languages and abilities.
          </p>
          <p>
            Our commitment is simple: <span className="text-foreground font-medium">respect first, technology second.</span>
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
          {[
            { k: "60+", v: "Countries supported" },
            { k: "100%", v: "Verified profiles policy" },
            { k: "0 ₹", v: "Free to create your profile" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="font-display text-5xl text-primary">{s.k}</p>
              <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <Link to="/signup">
          <Button className="h-12 rounded-full px-8">Be part of the journey</Button>
        </Link>
      </section>
    </SitePage>
  );
}