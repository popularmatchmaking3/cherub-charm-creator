import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — United Disabled Matrimony" }] }),
  component: MessagesPage,
});

interface Conv {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

function MessagesPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("conversations")
        .select("id, user1_id, user2_id, last_message_at")
        .order("last_message_at", { ascending: false });
      const rows = (data ?? []) as Omit<Conv, "other">[];
      const others = rows.map((c) => c.user1_id === user.id ? c.user2_id : c.user1_id);
      const { data: profs } = others.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", others)
        : { data: [] };
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      setConvs(rows.map((c) => ({
        ...c,
        other: byId.get(c.user1_id === user.id ? c.user2_id : c.user1_id) ?? null,
      })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Inbox</p>
      <h1 className="mt-2 font-display text-4xl">Messages</h1>
      {loading ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : convs.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          No conversations yet. Match with someone to start chatting.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
          {convs.map((c) => (
            <li key={c.id}>
              <Link to="/messages/$id" params={{ id: c.id }}
                className="flex items-center gap-4 p-4 transition hover:bg-secondary/40">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
                  {c.other?.avatar_url ? (
                    <img src={c.other.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-muted-foreground">
                      {(c.other?.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg">{c.other?.full_name ?? "Member"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.last_message_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}