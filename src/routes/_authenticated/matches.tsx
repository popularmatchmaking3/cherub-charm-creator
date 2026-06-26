import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ensureConversation } from "@/lib/match-actions";
import { Check, Eye, MessageCircle, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Matches — United Disabled Matrimony" }] }),
  component: MatchesPage,
});

type Status = "pending" | "accepted" | "declined";
interface Row {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: Status;
  created_at: string;
  other: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

function MatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [received, setReceived] = useState<Row[]>([]);
  const [sent, setSent] = useState<Row[]>([]);
  const [matched, setMatched] = useState<Row[]>([]);
  const [tab, setTab] = useState<"received" | "sent" | "matched">("received");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("interests")
      .select("id, sender_id, receiver_id, status, created_at")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Omit<Row, "other">[];
    const otherIds = Array.from(
      new Set(rows.map((r) => (r.sender_id === user.id ? r.receiver_id : r.sender_id))),
    );
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds)
      : { data: [] };
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    const enriched: Row[] = rows.map((r) => ({
      ...r,
      other: byId.get(r.sender_id === user.id ? r.receiver_id : r.sender_id) ?? null,
    }));
    const nextReceived = enriched.filter(
      (r) => r.receiver_id === user.id && r.status === "pending",
    );
    const nextSent = enriched.filter((r) => r.sender_id === user.id && r.status === "pending");
    const nextMatched = enriched.filter((r) => r.status === "accepted");
    setReceived(nextReceived);
    setSent(nextSent);
    setMatched(nextMatched);
    setTab((current) => {
      if (current === "received" && nextReceived.length === 0 && nextSent.length > 0) return "sent";
      if (current === "sent" && nextSent.length === 0 && nextReceived.length > 0) return "received";
      return current;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(row: Row, status: "accepted" | "declined") {
    const { error } = await supabase.from("interests").update({ status }).eq("id", row.id);
    if (error) return toast.error(error.message);
    if (status === "accepted" && user) {
      const otherId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
      try {
        await ensureConversation(user.id, otherId);
      } catch (e) {
        toast.error((e as Error).message);
      }
      toast.success("Match unlocked. You can now message or call.");
    } else {
      toast.success("Updated");
    }
    load();
  }

  async function openChat(row: Row) {
    if (!user || !row.other) return;
    const otherId = row.other.id;
    try {
      const convId = await ensureConversation(user.id, otherId);
      navigate({ to: "/messages/$id", params: { id: convId } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const list = tab === "received" ? received : tab === "sent" ? sent : matched;
  const counts = { received: received.length, sent: sent.length, matched: matched.length };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Connections</p>
      <h1 className="mt-2 font-display text-4xl">Matches</h1>

      <div className="mt-6 flex gap-2 border-b border-border">
        {(["received", "sent", "matched"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition ${
              tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            {t} {counts[t] > 0 && `(${counts[t]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="h-14 w-14 overflow-hidden rounded-full bg-secondary">
                {row.other?.avatar_url ? (
                  <img src={row.other.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xl text-muted-foreground">
                    {(row.other?.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  row.other && navigate({ to: "/profile/$id", params: { id: row.other.id } })
                }
              >
                <p className="font-display text-lg">{row.other?.full_name ?? "Member"}</p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {tab === "sent"
                    ? "Interest sent"
                    : tab === "received"
                      ? "Interested in you"
                      : "Matched"}
                </p>
              </button>
              {tab === "received" && row.status === "pending" && (
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    size="sm"
                    className="flex-1 rounded-full sm:flex-none"
                    onClick={() => respond(row, "accepted")}
                    data-sound="success"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-full sm:flex-none"
                    onClick={() => respond(row, "declined")}
                    data-sound="danger"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              )}
              {tab === "sent" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                  onClick={() =>
                    row.other && navigate({ to: "/profile/$id", params: { id: row.other.id } })
                  }
                >
                  <Eye className="mr-1 h-3.5 w-3.5" /> View profile
                </Button>
              )}
              {row.status === "accepted" && (
                <Button
                  size="sm"
                  className="w-full rounded-full sm:w-auto"
                  onClick={() => openChat(row)}
                >
                  <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
