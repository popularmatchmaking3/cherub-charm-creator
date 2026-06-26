import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Sparkles, Heart, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "Daily Recommendations — United Disabled Matrimony" }] }),
  component: RecommendationsPage,
});

interface RecRow {
  id: string;
  full_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  gender: string | null;
  interests: string[] | null;
}

function RecommendationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<RecRow[]>([]);
  const [interestMatches, setInterestMatches] = useState<RecRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: me } = await supabase
        .from("profiles")
        .select("gender,state,country,partner_min_age,partner_max_age,interests")
        .eq("id", user.id)
        .maybeSingle();

      const m = me as {
        gender?: string | null;
        state?: string | null;
        country?: string | null;
        partner_min_age?: number | null;
        partner_max_age?: number | null;
        interests?: string[] | null;
      } | null;

      // "Recommended for you": opposite-ish gender + same state/country (best-effort)
      let q = supabase
        .from("profiles")
        .select("id,full_name,city,state,country,date_of_birth,gender,interests")
        .eq("is_profile_complete", true)
        .eq("is_hidden", false)
        .neq("id", user.id)
        .limit(12);
      if (m?.gender === "male") q = q.eq("gender", "female");
      else if (m?.gender === "female") q = q.eq("gender", "male");
      if (m?.state) q = q.eq("state", m.state);
      else if (m?.country) q = q.eq("country", m.country);
      const { data: recs } = await q;

      // Interest based
      const myInterests = (m?.interests ?? []).filter(Boolean);
      let interestRows: RecRow[] = [];
      if (myInterests.length > 0) {
        const { data: ints } = await supabase
          .from("profiles")
          .select("id,full_name,city,state,country,date_of_birth,gender,interests")
          .eq("is_profile_complete", true)
          .eq("is_hidden", false)
          .neq("id", user.id)
          .overlaps("interests", myInterests)
          .limit(12);
        interestRows = (ints ?? []) as RecRow[];
      }

      if (cancelled) return;
      setRecommended((recs ?? []) as RecRow[]);
      // exclude duplicates already in `recommended`
      const recIds = new Set((recs ?? []).map((r) => r.id));
      setInterestMatches(interestRows.filter((r) => !recIds.has(r.id)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Today for you</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl sm:text-4xl">Daily Recommendations</h1>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/search">
            <SearchIcon className="mr-2 h-4 w-4" /> Browse all profiles
          </Link>
        </Button>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A handful of profiles picked for you based on your preferences and interests. Tap any
        card to view the full profile.
      </p>

      <Section
        title="Recommended for you"
        subtitle="Based on your partner preferences and location"
        icon={Sparkles}
        rows={recommended}
        loading={loading}
        emptyText="No recommendations yet. Complete your partner preferences for better picks."
      />

      <Section
        title="Based on your interests"
        subtitle="People who share your hobbies and interests"
        icon={Heart}
        rows={interestMatches}
        loading={loading}
        emptyText="Add interests to your profile to see people who share them."
      />
    </main>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  rows,
  loading,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  rows: RecRow[];
  loading: boolean;
  emptyText: string;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
            >
              <Link to="/profile/$id" params={{ id: r.id }} className="block p-5">
                <p className="font-display text-2xl uppercase tracking-wide leading-tight truncate">
                  {r.full_name ?? "Member"}
                </p>
                {(r.city || r.state || r.country) && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {[r.city, r.state, r.country].filter(Boolean).join(", ")}
                    </span>
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}