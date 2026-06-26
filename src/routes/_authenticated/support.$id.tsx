import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTicket, postTicketMessage } from "@/lib/support.functions";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { StatusPill } from "./support";

export const Route = createFileRoute("/_authenticated/support/$id")({
  head: () => ({ meta: [{ title: "Ticket — United Disabled Matrimony" }] }),
  component: TicketThreadPage,
});

interface Msg {
  id: string;
  sender_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}
interface TicketRow {
  id: string; user_id: string; subject: string; category: string;
  status: string; created_at: string; updated_at: string;
}

function TicketThreadPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const fetchT = useServerFn(getTicket);
  const postMsg = useServerFn(postTicketMessage);

  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const r = await fetchT({ data: { id } });
      setTicket(r.ticket as TicketRow);
      setMsgs(r.messages as Msg[]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function send() {
    if (reply.trim().length === 0) return;
    setSending(true);
    try {
      await postMsg({ data: { ticket_id: id, message: reply.trim() } });
      setReply("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (!ticket) {
    return <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">Loading…</main>;
  }

  const closed = ticket.status === "closed";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/support" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> All tickets
      </Link>

      <header className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ticket</p>
          <h1 className="mt-2 font-display text-3xl">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <StatusPill status={ticket.status} />
      </header>

      <section className="mt-6 space-y-3">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl border p-3 text-sm ${
                mine
                  ? "ml-auto border-primary/30 bg-primary/10"
                  : m.is_admin_reply
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-card"
              }`}
            >
              {m.is_admin_reply && !mine && (
                <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> United Disabled Matrimony team
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.message}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </section>

      {closed ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This ticket is closed. Please create a new ticket if you need further help.
        </p>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            maxLength={2000}
            className="min-h-20"
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={send} disabled={sending || reply.trim().length === 0} className="rounded-full">
              <Send className="mr-1 h-4 w-4" /> {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}