import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff, Settings2 } from "lucide-react";
import { adminGrantAdmin, adminUpdatePermissions } from "@/lib/admin.functions";
import { ADMIN_PERMS, type AdminPerm } from "@/lib/use-is-admin";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  component: AdminsPage,
});

interface AdminRow {
  id: string;
  user_id: string;
  permissions: string[] | null;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}

function AdminsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [mode, setMode] = useState<"full" | "role">("full");
  const [perms, setPerms] = useState<AdminPerm[]>([]);
  const [saving, setSaving] = useState(false);

  const grant = useServerFn(adminGrantAdmin);
  const updatePerms = useServerFn(adminUpdatePermissions);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("user_roles")
      .select("id, user_id, permissions").eq("role", "admin");
    const ids = (data ?? []).map((r) => r.user_id);
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] };
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    setRows((data ?? []).map((r) => ({
      id: r.id, user_id: r.user_id,
      permissions: (r as { permissions: string[] | null }).permissions,
      profile: byId.get(r.user_id) ?? null,
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(row: AdminRow) {
    const isFull = !row.permissions || row.permissions.length === 0;
    setMode(isFull ? "full" : "role");
    setPerms((row.permissions ?? []) as AdminPerm[]);
    setEditing(row);
  }

  async function save() {
    if (!editing) return;
    if (mode === "role" && perms.length === 0) { toast.error("Select at least one"); return; }
    setSaving(true);
    try {
      await updatePerms({ data: {
        user_id: editing.user_id,
        full_access: mode === "full",
        permissions: mode === "full" ? undefined : perms,
      } });
      toast.success("Permissions updated");
      setEditing(null); await load();
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  }

  async function revoke(row: AdminRow) {
    if (row.user_id === user?.id) { toast.error("You can't revoke yourself"); return; }
    if (!confirm(`Remove admin from ${row.profile?.full_name ?? "this user"}?`)) return;
    try {
      await grant({ data: { user_id: row.user_id, make_admin: false } });
      toast.success("Admin revoked");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <section>
      <p className="mb-4 text-sm text-muted-foreground">
        Manage who has admin access and which areas they can control.
      </p>
      <ul className="space-y-3">
        {rows.map((r) => {
          const isFull = !r.permissions || r.permissions.length === 0;
          const self = r.user_id === user?.id;
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Shield className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-display text-lg">
                      {r.profile?.full_name ?? "Admin"} {self && <span className="text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {isFull ? "Full Access" : `${r.permissions!.length} permission${r.permissions!.length === 1 ? "" : "s"}`}
                    </p>
                    {!isFull && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.permissions!.map((p) => (
                          <span key={p} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {ADMIN_PERMS.find((x) => x.key === p)?.label ?? p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => openEdit(r)}>
                  <Settings2 className="mr-1 h-3.5 w-3.5" /> Edit permissions
                </Button>
                {!self && (
                  <Button size="sm" variant="destructive" className="rounded-full" onClick={() => revoke(r)}>
                    <ShieldOff className="mr-1 h-3.5 w-3.5" /> Remove admin
                  </Button>
                )}
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No admins yet.
          </li>
        )}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit permissions</DialogTitle>
            <DialogDescription>
              {editing?.profile?.full_name ?? "Admin"} — choose access level.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "full" | "role")} className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="full" className="mt-1" />
              <div>
                <p className="font-medium">Full Access</p>
                <p className="text-xs text-muted-foreground">All admin features.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="role" className="mt-1" />
              <div>
                <p className="font-medium">Role-based access</p>
                <p className="text-xs text-muted-foreground">Pick allowed features.</p>
              </div>
            </label>
          </RadioGroup>
          {mode === "role" && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              {ADMIN_PERMS.map((p) => {
                const checked = perms.includes(p.key);
                return (
                  <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => {
                      setPerms((prev) => v ? [...prev, p.key] : prev.filter((k) => k !== p.key));
                    }} className="mt-1" />
                    <div>
                      <Label className="cursor-pointer">{p.label}</Label>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}