import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listAllTicketsAdmin, updateTicketStatus, TICKET_STATUSES,
} from "@/lib/support.functions";
import { ArrowLeft } from "lucide-react";
import { StatusPill } from "../support";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  head: () => ({ meta: [{ title: "Support tickets — Admin" }] }),
  component: AdminTicketsPage,
});

interface Row {
  id: string; user_id: string; subject: string; category: string;
  status: string; updated_at: string; user_name: string | null;
}

function AdminTicketsPage() {
  const list = useServerFn(listAllTicketsAdmin);
  const setStatus = useServerFn(updateTicketStatus);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<(typeof TICKET_STATUSES)[number] | "all">("open");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    list({ data: { status: filter } })
      .then((r) => setRows(r as Row[]))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function changeStatus(id: string, status: (typeof TICKET_STATUSES)[number]) {
    try {
      await setStatus({ data: { id, status } });
      toast.success("Status updated.");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Admin
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-display text-3xl">Support tickets</h1>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as never)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/support/$id", params: { id: r.id } })}
                    className="block w-full truncate text-left text-sm font-medium hover:underline"
                  >
                    {r.subject}
                  </button>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.user_name ?? "Member"} · {r.category} · {new Date(r.updated_at).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={r.status} />
                <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v as never)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm" variant="outline" className="rounded-full"
                  onClick={() => navigate({ to: "/support/$id", params: { id: r.id } })}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}