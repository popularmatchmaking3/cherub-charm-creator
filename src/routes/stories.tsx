import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Calendar, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Success Stories — United Disabled Matrimony" },
      {
        name: "description",
        content:
          "Real couples who found each other on United Disabled Matrimony. Read inspiring matrimonial success stories from people with disabilities.",
      },
      { property: "og:title", content: "Success Stories — United Disabled Matrimony" },
      {
        property: "og:description",
        content: "Real matrimonial success stories from members of the United Disabled Matrimony community.",
      },
    ],
  }),
  component: StoriesPage,
});

interface Story {
  id: string;
  couple_names: string;
  story: string;
  image_url: string | null;
  married_on: string | null;
  created_at: string;
}

function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("success_stories" as never)
      .select("id, couple_names, story, image_url, married_on, created_at")
      .eq("is_published" as never, true as never)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setStories(((data ?? []) as unknown) as Story[]);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">United Disabled Matrimony</Link>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">United Disabled Matrimony community</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Success stories</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Real couples who met on United Disabled Matrimony and built a life together. Every story is shared with their consent.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading stories…</p>
        ) : stories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              No published stories yet. Be the first — once you find your match, share your story with us.
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {stories.map((s) => (
              <li
                key={s.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg"
              >
                {s.image_url ? (
                  <img src={s.image_url} alt={s.couple_names} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-secondary">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="font-display text-2xl">{s.couple_names}</h2>
                  {s.married_on && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Married {new Date(s.married_on).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  )}
                  <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">{s.story}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}