import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { adminReviewMembership } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: RequestsPage,
});

interface Req {
  id: string;
  user_id: string;
  requested_tier: "free" | "premium";
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_name: string | null;
}

function RequestsPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const review = useServerFn(adminReviewMembership);

  async function load() {
    setLoading(true);
    let q = supabase.from("membership_requests")
      .select("id, user_id, requested_tier, note, status, created_at")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const byId = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
    setRows(((data ?? []) as Omit<Req, "user_name">[]).map((r) => ({
      ...r, user_name: byId.get(r.user_id) ?? null,
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function act(id: string, action: "approve" | "reject") {
    try {
      await review({ data: { request_id: id, action, days: 30 } });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{r.user_name ?? "User"}</p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Requested: {r.requested_tier} · {new Date(r.created_at).toLocaleDateString()} · {r.status}
                  </p>
                  {r.note && <p className="mt-2 text-sm">{r.note}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full"
                      onClick={() => act(r.id, "reject")}>Reject</Button>
                    <Button size="sm" className="rounded-full"
                      onClick={() => act(r.id, "approve")}>Approve (30 days)</Button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              No requests.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}