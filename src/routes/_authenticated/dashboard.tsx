import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/profile-options";
import { Sparkles, BadgeCheck, Heart, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { sendInterest as createInterest, type ConnectionState } from "@/lib/match-actions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Browse — United Disabled Matrimony" }] }),
  component: Dashboard,
});

interface ProfileRow {
  id: string;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  disability_category: string | null;
  disability_percentage: number | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  is_profile_complete: boolean;
  is_verified: boolean;
  disability_verified: boolean;
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [me, setMe] = useState<{ is_profile_complete: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [interestState, setInterestState] = useState<Map<string, Exclude<ConnectionState, "none">>>(
    new Map(),
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: mine }, { data: list }, { data: myInterests }] = await Promise.all([
        supabase.from("profiles").select("is_profile_complete").eq("id", user.id).maybeSingle(),
        supabase
          .from("profiles")
          .select(
            "id, full_name, gender, date_of_birth, disability_category, disability_percentage, city, state, avatar_url, is_profile_complete, is_verified, disability_verified",
          )
          .eq("is_profile_complete", true)
          .eq("is_hidden", false)
          .neq("id", user.id)
          .limit(50),
        supabase.from("interests").select("sender_id, receiver_id, status"),
      ]);
      setMe(mine as { is_profile_complete: boolean } | null);
      setProfiles((list as ProfileRow[] | null) ?? []);
      const interests = (myInterests ?? []) as {
        sender_id: string;
        receiver_id: string;
        status: "pending" | "accepted" | "declined";
      }[];
      type InterestBadgeState = Exclude<ConnectionState, "none">;
      setInterestState(
        new Map(
          interests
            .filter((i) => i.status !== "declined")
            .map((i): [string, InterestBadgeState] => [
              i.sender_id === user.id ? i.receiver_id : i.sender_id,
              i.status === "accepted" ? "matched" : i.receiver_id === user.id ? "received" : "sent",
            ]),
        ),
      );
      setLoading(false);
    })();
  }, [user]);

  async function sendInterest(receiverId: string) {
    if (!user) return;
    try {
      const next = await createInterest(user.id, receiverId);
      setInterestState((s) =>
        new Map(s).set(receiverId, next.state === "none" ? "sent" : next.state),
      );
      if (next.state === "received") {
        toast.info("They've sent you an interest. Open their profile to accept.");
        return;
      }
      if (next.state === "matched") {
        toast.success("You're already matched.");
        return;
      }
    } catch (e) {
      return toast.error((e as Error).message);
    }
    toast.success("Interest sent");
  }

  if (loading) {
    return <div className="px-6 py-10 text-muted-foreground">Loading…</div>;
  }

  if (me && !me.is_profile_complete) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-4 font-display text-4xl">Complete your profile</h1>
        <p className="mt-3 text-muted-foreground">
          Set up your profile so we can show you to potential matches.
        </p>
        <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/onboarding" })}>
          Continue setup
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">For you today</p>
      <h1 className="mt-2 font-display text-4xl">Daily recommendations</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A fresh, curated set of profiles picked for you. Come back daily for new suggestions.
      </p>

      {profiles.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          No other profiles yet. Invite friends to join — your match could be one signup away.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const age = p.date_of_birth
              ? Math.floor(
                  (Date.now() - new Date(p.date_of_birth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000),
                )
              : null;
            const state = interestState.get(p.id);
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-[4/5] bg-secondary">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name ?? "Profile"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl font-display text-muted-foreground">
                      {(p.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="flex items-center gap-2 font-display text-xl">
                    {p.full_name ?? "Member"}
                    {p.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    {p.disability_verified && <Heart className="h-4 w-4 text-emerald-600" />}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {age ? `${age} yrs` : "—"} ·{" "}
                    {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-primary">
                    {categoryLabel(p.disability_category)} · {p.disability_percentage ?? 0}%
                  </p>
                  {state === "matched" || state === "received" ? (
                    <Link to="/profile/$id" params={{ id: p.id }}>
                      <Button
                        size="sm"
                        className="mt-3 w-full rounded-full"
                        data-sound={state === "received" ? "success" : "tap"}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />{" "}
                        {state === "received" ? "Respond to interest" : "Open unlocked profile"}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-full"
                      variant={state ? "outline" : "default"}
                      disabled={!!state}
                      onClick={() => sendInterest(p.id)}
                      data-sound="send"
                    >
                      {state ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Interest sent
                        </>
                      ) : (
                        <>
                          <Heart className="mr-1 h-3.5 w-3.5" /> Send interest
                        </>
                      )}
                    </Button>
                  )}
                  <Link
                    to="/profile/$id"
                    params={{ id: p.id }}
                    className="mt-2 block text-center text-xs text-primary hover:underline"
                  >
                    View full profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
