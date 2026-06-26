import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/profile-options";
import {
  adminToggleVerify, adminReviewVerification, adminGetVerificationDocUrl,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Heart, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/verify")({
  component: VerifyPage,
});

interface Row {
  id: string; full_name: string | null;
  disability_category: string | null; disability_percentage: number | null;
  city: string | null; state: string | null;
  is_verified: boolean; is_profile_complete: boolean;
  id_verification_status: "none" | "pending" | "verified" | "rejected";
  id_verification_url: string | null;
  disability_verification_status: "none" | "pending" | "verified" | "rejected";
  disability_verification_url: string | null;
  disability_verified: boolean;
}

function VerifyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const toggle = useServerFn(adminToggleVerify);
  const review = useServerFn(adminReviewVerification);
  const signDoc = useServerFn(adminGetVerificationDocUrl);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles")
      .select(
        "id, full_name, disability_category, disability_percentage, city, state, is_verified, is_profile_complete, id_verification_status, id_verification_url, disability_verification_status, disability_verification_url, disability_verified",
      )
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const hasPending = (r: Row) =>
    r.id_verification_status === "pending" || r.disability_verification_status === "pending";
  const visible = rows.filter((r) =>
    filter === "all" ? true
    : filter === "verified" ? r.is_verified
    : (hasPending(r) || (!r.is_verified && r.is_profile_complete)));

  async function flip(r: Row) {
    try { await toggle({ data: { user_id: r.id, verified: !r.is_verified } }); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function openDoc(path: string | null) {
    if (!path) { toast.error("Document missing"); return; }
    try {
      const { url } = await signDoc({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) { toast.error((e as Error).message); }
  }

  async function decide(user_id: string, kind: "id" | "disability", action: "approve" | "reject") {
    let note: string | undefined;
    if (action === "reject") {
      const n = prompt("Reason for rejection (member ko dikhega):") ?? "";
      if (!n.trim()) return;
      note = n.trim();
    }
    try {
      await review({ data: { user_id, kind, action, note } });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {(["pending", "verified", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-display text-lg">
                    {r.full_name ?? "Unnamed"}
                    {r.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {r.disability_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <Heart className="h-3 w-3" /> Disability verified
                      </span>
                    )}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {categoryLabel(r.disability_category)} · {r.disability_percentage ?? 0}% ·
                    {" "}{[r.city, r.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <Button size="sm" variant={r.is_verified ? "outline" : "default"}
                  className="rounded-full" onClick={() => flip(r)}>
                  {r.is_verified ? "Revoke verified" : "Quick verify"}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <VerifReviewBlock
                  title="Identity (Govt ID)"
                  status={r.id_verification_status}
                  hasDoc={!!r.id_verification_url}
                  onOpen={() => openDoc(r.id_verification_url)}
                  onApprove={() => decide(r.id, "id", "approve")}
                  onReject={() => decide(r.id, "id", "reject")}
                />
                <VerifReviewBlock
                  title="Disability proof"
                  status={r.disability_verification_status}
                  hasDoc={!!r.disability_verification_url}
                  onOpen={() => openDoc(r.disability_verification_url)}
                  onApprove={() => decide(r.id, "disability", "approve")}
                  onReject={() => decide(r.id, "disability", "reject")}
                />
              </div>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              Nothing to review.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function VerifReviewBlock({
  title, status, hasDoc, onOpen, onApprove, onReject,
}: {
  title: string;
  status: "none" | "pending" | "verified" | "rejected";
  hasDoc: boolean;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pill = {
    none:     { label: "Not submitted", icon: AlertCircle, cls: "bg-secondary text-muted-foreground" },
    pending:  { label: "Pending",       icon: Clock,       cls: "bg-amber-500/15 text-amber-700" },
    verified: { label: "Verified",      icon: BadgeCheck,  cls: "bg-primary/10 text-primary" },
    rejected: { label: "Rejected",      icon: AlertCircle, cls: "bg-destructive/10 text-destructive" },
  }[status];
  const Icon = pill.icon;
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${pill.cls}`}>
          <Icon className="h-3 w-3" /> {pill.label}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-full" disabled={!hasDoc} onClick={onOpen}>
          <ExternalLink className="h-3.5 w-3.5" /> View doc
        </Button>
        <Button size="sm" className="rounded-full" disabled={!hasDoc || status === "verified"} onClick={onApprove}>
          Approve
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" disabled={!hasDoc || status === "rejected"} onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}