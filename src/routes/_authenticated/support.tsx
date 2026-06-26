import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createTicket, listMyTickets, TICKET_CATEGORIES } from "@/lib/support.functions";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Help & Support — United Disabled Matrimony" }] }),
  component: SupportPage,
});

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  updated_at: string;
}

function SupportPage() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listMyTickets);
  const create = useServerFn(createTicket);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetchList()
      .then((rows) => setTickets(rows as Ticket[]))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function submit() {
    if (subject.trim().length < 3) { toast.error("Please add a more detailed subject."); return; }
    if (message.trim().length < 5) { toast.error("Please write a message."); return; }
    setSubmitting(true);
    try {
      const r = await create({ data: { subject: subject.trim(), category, message: message.trim() } });
      toast.success("Ticket created.");
      setShowForm(false); setSubject(""); setMessage(""); setCategory("general");
      navigate({ to: "/support/$id", params: { id: r.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to settings
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Support</p>
          <h1 className="mt-2 font-display text-4xl">Help &amp; Support</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have a problem, question or feedback? Open a ticket — our team replies within 24–48 hours.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> New ticket
          </Button>
        )}
      </div>

      {showForm && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">New ticket</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Subject</label>
              <Input
                className="mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={140}
                placeholder="Short summary"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Message</label>
              <Textarea
                className="mt-1 min-h-32"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder="Describe the issue in detail — what happened, when, and any extra info or screenshots."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button className="rounded-full" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit ticket"}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">My tickets</p>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="mt-6 flex flex-col items-center text-center text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-sm">No tickets yet.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  to="/support/$id" params={{ id: t.id }}
                  className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {labelFor(t.category)} · Updated {new Date(t.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function labelFor(value: string) {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-amber-500/15 text-amber-700",
    in_progress: "bg-blue-500/15 text-blue-700",
    resolved: "bg-emerald-500/15 text-emerald-700",
    closed: "bg-secondary text-muted-foreground",
  };
  const label: Record<string, string> = {
    open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? map.open}`}>
      {label[status] ?? status}
    </span>
  );
}