import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { categoryLabel } from "@/lib/profile-options";
import { BadgeCheck, Crown, EyeOff, Eye, Shield, Ban } from "lucide-react";
import {
  adminSetMembership, adminToggleHidden, adminToggleVerify, adminGrantAdmin, adminSetMessageLimit,
} from "@/lib/admin.functions";
import { adminBanUser, adminUnbanUser } from "@/lib/security.functions";
import { adminToggleProtection } from "@/lib/admin.functions";
import { ADMIN_PERMS, type AdminPerm } from "@/lib/use-is-admin";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

interface Row {
  id: string;
  full_name: string | null;
  disability_category: string | null;
  disability_percentage: number | null;
  city: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  membership_tier: "free" | "premium";
  membership_expires_at: string | null;
  banned_until: string | null;
  is_banned_permanent: boolean;
  block_disabled: boolean;
  report_disabled: boolean;
  daily_message_limit_override: number | null;
}

function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [grantDialog, setGrantDialog] = useState<Row | null>(null);
  const [accessMode, setAccessMode] = useState<"full" | "role">("full");
  const [selectedPerms, setSelectedPerms] = useState<AdminPerm[]>([]);
  const [granting, setGranting] = useState(false);

  const setMem = useServerFn(adminSetMembership);
  const toggleHide = useServerFn(adminToggleHidden);
  const toggleVerify = useServerFn(adminToggleVerify);
  const grantAdmin = useServerFn(adminGrantAdmin);
  const banUser = useServerFn(adminBanUser);
  const unbanUser = useServerFn(adminUnbanUser);
  const toggleProtection = useServerFn(adminToggleProtection);
  const setMsgLimit = useServerFn(adminSetMessageLimit);
  const [banDialog, setBanDialog] = useState<Row | null>(null);
  const [banType, setBanType] = useState<"temporary" | "permanent">("temporary");
  const [banDays, setBanDays] = useState<number>(7);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select(
        "id, full_name, disability_category, disability_percentage, city, is_verified, is_hidden, membership_tier, membership_expires_at, banned_until, is_banned_permanent, block_disabled, report_disabled, daily_message_limit_override",
      ).order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    setRows((ps ?? []) as Row[]);
    setAdmins(new Set((rs ?? []).map((r: { user_id: string }) => r.user_id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Exclude admins — they live in the Admins tab.
  const filtered = rows
    .filter((r) => !admins.has(r.id))
    .filter((r) =>
      !q || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase())
      || (r.city ?? "").toLowerCase().includes(q.toLowerCase()));

  async function call<T>(fn: () => Promise<T>) {
    try { await fn(); await load(); toast.success("Done"); }
    catch (e) { toast.error((e as Error).message); }
  }

  function openGrant(row: Row) {
    setAccessMode("full");
    setSelectedPerms([]);
    setGrantDialog(row);
  }

  async function submitGrant() {
    if (!grantDialog) return;
    if (accessMode === "role" && selectedPerms.length === 0) {
      toast.error("Select at least one permission");
      return;
    }
    setGranting(true);
    try {
      await grantAdmin({ data: {
        user_id: grantDialog.id,
        make_admin: true,
        full_access: accessMode === "full",
        permissions: accessMode === "full" ? undefined : selectedPerms,
      } });
      toast.success("Admin granted");
      setGrantDialog(null);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    setGranting(false);
  }

  function openBan(row: Row) {
    setBanType("temporary"); setBanDays(7); setBanReason(""); setBanDialog(row);
  }
  async function submitBan() {
    if (!banDialog) return;
    setBanning(true);
    try {
      await banUser({ data: {
        user_id: banDialog.id,
        type: banType,
        days: banType === "temporary" ? banDays : undefined,
        reason: banReason.trim() || undefined,
      } });
      toast.success(banType === "permanent" ? "User permanently banned (IP blocked)" : "User suspended");
      setBanDialog(null);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    setBanning(false);
  }
  async function handleUnban(row: Row) {
    try {
      await unbanUser({ data: { user_id: row.id } });
      toast.success("User unbanned");
      await load();
    } catch (e) { toast.error((e as Error).message); }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <section>
      <Input placeholder="Search by name or city…" value={q}
        onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <ul className="space-y-3">
        {filtered.map((r) => {
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-display text-lg">
                    {r.full_name ?? "Unnamed"}
                    {r.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    {r.membership_tier === "premium" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    )}
                    {r.is_hidden && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                    {r.is_banned_permanent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                        <Ban className="h-3 w-3" /> Permanently banned
                      </span>
                    )}
                    {!r.is_banned_permanent && r.banned_until && new Date(r.banned_until) > new Date() && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                        <Ban className="h-3 w-3" /> Suspended till {new Date(r.banned_until).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {categoryLabel(r.disability_category)} · {r.disability_percentage ?? 0}% · {r.city ?? "—"}
                  </p>
                  {r.membership_expires_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Premium until {new Date(r.membership_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => call(() => toggleVerify({ data: { user_id: r.id, verified: !r.is_verified } }))}>
                  {r.is_verified ? "Revoke verify" : "Verify"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => call(() => setMem({
                    data: { user_id: r.id, tier: r.membership_tier === "premium" ? "free" : "premium", days: 30 },
                  }))}>
                  {r.membership_tier === "premium" ? "Make Free" : "Make Premium (30d)"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => call(() => toggleHide({ data: { user_id: r.id, hidden: !r.is_hidden } }))}>
                  {r.is_hidden ? <><Eye className="mr-1 h-3.5 w-3.5" /> Unhide</> : <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</>}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => openGrant(r)}>
                  <Shield className="mr-1 h-3.5 w-3.5" /> Make admin
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => call(() => toggleProtection({ data: { user_id: r.id, block_disabled: !r.block_disabled } }))}>
                  {r.block_disabled ? "Allow block" : "Disable block"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => call(() => toggleProtection({ data: { user_id: r.id, report_disabled: !r.report_disabled } }))}>
                  {r.report_disabled ? "Allow report" : "Disable report"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => {
                    const v = prompt(
                      `Set daily message limit for ${r.full_name ?? "user"}.\n` +
                      `Empty = use default (free/premium from app settings).\n` +
                      `Current: ${r.daily_message_limit_override ?? "default"}`,
                      r.daily_message_limit_override?.toString() ?? "",
                    );
                    if (v === null) return;
                    const trimmed = v.trim();
                    const limit = trimmed === "" ? null : parseInt(trimmed, 10);
                    if (limit !== null && (Number.isNaN(limit) || limit < 0)) {
                      toast.error("Enter a non-negative number or leave empty");
                      return;
                    }
                    call(() => setMsgLimit({ data: { user_id: r.id, limit } }));
                  }}>
                  Msg limit{r.daily_message_limit_override !== null ? ` (${r.daily_message_limit_override})` : ""}
                </Button>
                {(r.is_banned_permanent || (r.banned_until && new Date(r.banned_until) > new Date())) ? (
                  <Button size="sm" variant="outline" className="rounded-full"
                    onClick={() => handleUnban(r)}>
                    Unban
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" className="rounded-full"
                    onClick={() => openBan(r)}>
                    <Ban className="mr-1 h-3.5 w-3.5" /> Ban
                  </Button>
                )}
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            No users found.
          </li>
        )}
      </ul>

      <Dialog open={!!grantDialog} onOpenChange={(o) => !o && setGrantDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make {grantDialog?.full_name ?? "user"} an admin</DialogTitle>
            <DialogDescription>
              Choose the level of access this admin will have.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={accessMode} onValueChange={(v) => setAccessMode(v as "full" | "role")}
            className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="full" id="acc-full" className="mt-1" />
              <div>
                <p className="font-medium">Full Access</p>
                <p className="text-xs text-muted-foreground">All admin features and settings.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="role" id="acc-role" className="mt-1" />
              <div>
                <p className="font-medium">Role-based access</p>
                <p className="text-xs text-muted-foreground">Pick the features they can manage.</p>
              </div>
            </label>
          </RadioGroup>

          {accessMode === "role" && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              {ADMIN_PERMS.map((p) => {
                const checked = selectedPerms.includes(p.key);
                return (
                  <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => {
                      setSelectedPerms((prev) => v ? [...prev, p.key] : prev.filter((k) => k !== p.key));
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
            <Button variant="outline" onClick={() => setGrantDialog(null)}>Cancel</Button>
            <Button onClick={submitGrant} disabled={granting}>
              {granting ? "Granting…" : "Grant admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!banDialog} onOpenChange={(o) => !o && setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {banDialog?.full_name ?? "user"}</DialogTitle>
            <DialogDescription>
              Temporary ban suspends the account for chosen days. Permanent ban
              blocks all known IP addresses too.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={banType} onValueChange={(v) => setBanType(v as "temporary" | "permanent")}
            className="space-y-2">
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="temporary" id="ban-temp" className="mt-1" />
              <div className="flex-1">
                <p className="font-medium">Temporary</p>
                <p className="text-xs text-muted-foreground">Account suspended for a fixed number of days.</p>
                {banType === "temporary" && (
                  <Input type="number" min={1} max={3650} value={banDays}
                    onChange={(e) => setBanDays(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-2 max-w-[120px]" />
                )}
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <RadioGroupItem value="permanent" id="ban-perm" className="mt-1" />
              <div>
                <p className="font-medium">Permanent</p>
                <p className="text-xs text-muted-foreground">All known IPs are blocked from signing in.</p>
              </div>
            </label>
          </RadioGroup>
          <Input placeholder="Reason (optional)" value={banReason}
            onChange={(e) => setBanReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitBan} disabled={banning}>
              {banning ? "Banning…" : "Confirm ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}