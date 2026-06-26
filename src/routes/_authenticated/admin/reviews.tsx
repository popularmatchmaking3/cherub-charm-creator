import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAdminPerms } from "@/lib/use-is-admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, ShieldAlert, RefreshCcw, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({ meta: [{ title: "Account reviews — Admin" }] }),
  component: AdminReviewsPage,
});

type ReviewStatus = "pending" | "approved" | "rejected";

interface Row {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  review_status: ReviewStatus;
  review_notes: string | null;
  is_profile_complete: boolean;
  city: string | null;
  state: string | null;
  country: string | null;
  gender: string | null;
}

function AdminReviewsPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminPerms();
  const [tab, setTab] = useState<ReviewStatus>("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  // editable messages
  const [pendingMsg, setPendingMsg] = useState("");
  const [rejectedMsg, setRejectedMsg] = useState("");
  const [approvedMsg, setApprovedMsg] = useState("");
  const [savingMsgs, setSavingMsgs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,created_at,review_status,review_notes,is_profile_complete,city,state,country,gender")
      .eq("review_status", tab)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []).map((d) => ({ ...d, email: null })) as Row[]);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("review_pending_message,review_rejected_message,review_approved_welcome")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const d = data as {
          review_pending_message?: string;
          review_rejected_message?: string;
          review_approved_welcome?: string;
        };
        setPendingMsg(d.review_pending_message ?? "");
        setRejectedMsg(d.review_rejected_message ?? "");
        setApprovedMsg(d.review_approved_welcome ?? "");
      });
  }, []);

  async function decide(id: string, status: ReviewStatus) {
    const notes = notesById[id]?.trim() || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        review_status: status,
        review_decided_at: new Date().toISOString(),
        review_decided_by: user?.id ?? null,
        review_notes: notes,
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked ${status}.`);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function saveMessages() {
    setSavingMsgs(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        review_pending_message: pendingMsg,
        review_rejected_message: rejectedMsg,
        review_approved_welcome: approvedMsg,
      })
      .eq("id", 1);
    setSavingMsgs(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review messages saved.");
  }

  if (adminLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!isAdmin)
    return (
      <div className="text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2">Admins only.</p>
      </div>
    );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl">Account reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or reject new sign-ups. Pending users are blocked from browsing or contacting
          anyone until you approve.
        </p>

        <div className="mt-4 flex gap-2">
          {(["pending", "approved", "rejected"] as ReviewStatus[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={load}>
            <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>

        <ul className="mt-4 space-y-3">
          {loading && <li className="text-sm text-muted-foreground">Loading…</li>}
          {!loading && rows.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No {tab} accounts.
            </li>
          )}
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to="/profile/$id"
                    params={{ id: r.id }}
                    className="font-display text-lg hover:underline"
                  >
                    {r.full_name || "(no name)"}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.gender ?? "—"} · {[r.city, r.state, r.country].filter(Boolean).join(", ") || "no location"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Signed up: {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs">
                    Profile completed: {r.is_profile_complete ? "✓" : "✗"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    r.review_status === "pending"
                      ? "bg-amber-500/15 text-amber-700"
                      : r.review_status === "approved"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  <Clock className="h-3 w-3" /> {r.review_status}
                </span>
              </div>

              <Textarea
                rows={2}
                className="mt-3"
                placeholder="Reviewer notes (shown to the user if rejected — optional)"
                value={notesById[r.id] ?? r.review_notes ?? ""}
                onChange={(e) => setNotesById((m) => ({ ...m, [r.id]: e.target.value }))}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {r.review_status !== "approved" && (
                  <Button size="sm" className="rounded-full" onClick={() => decide(r.id, "approved")}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                )}
                {r.review_status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => decide(r.id, "rejected")}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                )}
                {r.review_status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => decide(r.id, "pending")}
                  >
                    <Clock className="mr-1 h-4 w-4" /> Move back to pending
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Messages shown to users</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          These messages appear on the "Account under review" page based on the user's status.
          Edit and save to update for everyone.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Pending message">
            <Textarea rows={5} value={pendingMsg} onChange={(e) => setPendingMsg(e.target.value)} />
          </Field>
          <Field label="Rejected message">
            <Textarea rows={5} value={rejectedMsg} onChange={(e) => setRejectedMsg(e.target.value)} />
          </Field>
          <Field label="Approved welcome">
            <Textarea rows={5} value={approvedMsg} onChange={(e) => setApprovedMsg(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Button className="rounded-full" disabled={savingMsgs} onClick={saveMessages}>
            <Save className="mr-2 h-4 w-4" /> {savingMsgs ? "Saving…" : "Save messages"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}