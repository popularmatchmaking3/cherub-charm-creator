import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Notes — Supabase Connected" },
      { name: "description", content: "Notes app powered by Supabase + Lovable." },
    ],
  }),
  component: Index,
});

type Note = {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
};

function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("notes")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotes((data as Note[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">✅ Supabase Connected</h1>
      <p className="text-muted-foreground mb-6">
        Sab kuch kaam kar raha hai. Yeh rahe aapke notes:
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : notes.length === 0 ? (
        <p>Koi notes nahi mile.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="border rounded-lg p-4">
              <h2 className="font-semibold">{n.title}</h2>
              {n.content && <p className="text-sm text-muted-foreground mt-1">{n.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
