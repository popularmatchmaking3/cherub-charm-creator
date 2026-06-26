import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getLoginHistory, logoutAllDevices, deleteMyAccount,
} from "@/lib/account.functions";
import { setDeviceTrust } from "@/lib/devices.functions";
import { LanguageSelector } from "@/components/language-selector";
import {
  ShieldAlert, LogOut, Trash2, MapPin, Monitor, ArrowLeft, Phone, Video,
  BadgeCheck, Upload, Lock, Check, X, Clock, AlertCircle, Image as ImageIcon,
  ShieldCheck, LifeBuoy, HelpCircle, ChevronRight, BookOpen, Globe, Eye, KeyRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — United Disabled Matrimony" }] }),
  component: SettingsPage,
});

interface HistoryRow {
  id: string;
  ip: string | null;
  user_agent: string | null;
  device_label: string | null;
  country: string | null;
  city: string | null;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  is_trusted: boolean;
  created_at: string;
}

type VerifStatus = "none" | "pending" | "verified" | "rejected";

interface VerifState {
  id_verification_status: VerifStatus;
  id_verification_url: string | null;
  id_verification_note: string | null;
  disability_verification_status: VerifStatus;
  disability_verification_url: string | null;
  disability_verification_note: string | null;
  disability_verified: boolean;
  is_verified: boolean;
  photos_private: boolean;
}

interface IncomingPhotoReq {
  id: string;
  requester_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  requester_name: string | null;
  requester_avatar: string | null;
}

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchHistory = useServerFn(getLoginHistory);
  const logoutAll = useServerFn(logoutAllDevices);
  const deleteAcc = useServerFn(deleteMyAccount);
  const trustDev = useServerFn(setDeviceTrust);

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [verif, setVerif] = useState<VerifState | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingDis, setUploadingDis] = useState(false);
  const [incomingReqs, setIncomingReqs] = useState<IncomingPhotoReq[]>([]);

  useEffect(() => {
    fetchHistory()
      .then((r) => setRows(r.rows as HistoryRow[]))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [fetchHistory]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "accept_audio_calls,accept_video_calls,show_online_status,id_verification_status,id_verification_url,id_verification_note,disability_verification_status,disability_verification_url,disability_verification_note,disability_verified,is_verified,photos_private",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAudioOn(data.accept_audio_calls ?? true);
          setVideoOn(data.accept_video_calls ?? true);
          setShowOnline(data.show_online_status ?? true);
          setVerif({
            id_verification_status: (data.id_verification_status ?? "none") as VerifStatus,
            id_verification_url: data.id_verification_url ?? null,
            id_verification_note: data.id_verification_note ?? null,
            disability_verification_status: (data.disability_verification_status ?? "none") as VerifStatus,
            disability_verification_url: data.disability_verification_url ?? null,
            disability_verification_note: data.disability_verification_note ?? null,
            disability_verified: data.disability_verified ?? false,
            is_verified: data.is_verified ?? false,
            photos_private: data.photos_private ?? false,
          });
        }
        setPrefsLoaded(true);
      });
  }, [user]);

  const loadIncomingPhotoReqs = async () => {
    if (!user) return;
    const { data: reqs } = await supabase
      .from("photo_access_requests")
      .select("id,requester_id,status,created_at")
      .eq("owner_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const rows = (reqs ?? []) as { id: string; requester_id: string; status: "pending"; created_at: string }[];
    if (rows.length === 0) { setIncomingReqs([]); return; }
    const ids = rows.map((r) => r.requester_id);
    const { data: profs } = await supabase
      .from("profiles").select("id,full_name,avatar_url").in("id", ids);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    setIncomingReqs(
      rows.map((r) => ({
        ...r,
        requester_name: byId.get(r.requester_id)?.full_name ?? null,
        requester_avatar: byId.get(r.requester_id)?.avatar_url ?? null,
      })),
    );
  };

  useEffect(() => { loadIncomingPhotoReqs(); /* eslint-disable-next-line */ }, [user]);

  async function toggleTrust(id: string, next: boolean) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_trusted: next } : r)));
    try {
      await trustDev({ data: { id, trusted: next } });
      toast.success(next ? "Device marked trusted." : "Removed trust from device.");
    } catch (e) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_trusted: !next } : r)));
      toast.error((e as Error).message);
    }
  }

  async function toggleShowOnline(value: boolean) {
    if (!user) return;
    const prev = showOnline;
    setShowOnline(value);
    const { error } = await supabase.from("profiles").update({ show_online_status: value }).eq("id", user.id);
    if (error) {
      setShowOnline(prev);
      toast.error(error.message);
      return;
    }
    toast.success(value ? "Your online status is now visible." : "Your online status is now hidden.");
  }

  const lastLogin = rows[0] ?? null;
  const previousLogin = rows[1] ?? null;
  const suspiciousCount = rows.filter((r) => r.is_suspicious).length;

  async function uploadVerificationDoc(file: File, kind: "id" | "disability") {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be smaller than 5 MB."); return; }
    const setBusyFn = kind === "id" ? setUploadingId : setUploadingDis;
    setBusyFn(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("verification-docs").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setBusyFn(false); return; }
    const patch = kind === "id"
      ? {
          id_verification_url: path,
          id_verification_status: "pending" as const,
          id_verification_submitted_at: new Date().toISOString(),
          id_verification_note: null,
        }
      : {
          disability_verification_url: path,
          disability_verification_status: "pending" as const,
          disability_verification_submitted_at: new Date().toISOString(),
          disability_verification_note: null,
        };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setBusyFn(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Document uploaded. Our team will review it shortly.");
    setVerif((v) => v ? { ...v, ...patch } as VerifState : v);
  }

  async function togglePhotosPrivate(value: boolean) {
    if (!user || !verif) return;
    setVerif({ ...verif, photos_private: value });
    const { error } = await supabase.from("profiles")
      .update({ photos_private: value }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      setVerif({ ...verif, photos_private: !value });
      return;
    }
    toast.success(value ? "Your photos are now private." : "Your photos are now visible to all members.");
  }

  async function decidePhotoReq(id: string, action: "approve" | "reject") {
    const { error } = await supabase.from("photo_access_requests")
      .update({ status: action === "approve" ? "approved" : "rejected" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "approve" ? "Request approved." : "Request rejected.");
    setIncomingReqs((rs) => rs.filter((r) => r.id !== id));
  }

  async function updateCallPref(field: "accept_audio_calls" | "accept_video_calls", value: boolean) {
    if (!user) return;
    if (field === "accept_audio_calls") setAudioOn(value);
    else setVideoOn(value);
    const payload =
      field === "accept_audio_calls"
        ? { accept_audio_calls: value }
        : { accept_video_calls: value };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      // revert
      if (field === "accept_audio_calls") setAudioOn(!value);
      else setVideoOn(!value);
      return;
    }
    toast.success(value ? "Calls turned on." : "Calls turned off.");
  }

  async function handleLogoutAll() {
    setBusy(true);
    try {
      await logoutAll();
      toast.success("Signed out from all devices.");
      await supabase.auth.signOut();
      navigate({ to: "/login" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteAcc();
      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to profile
      </Link>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">Settings</p>
      <h1 className="mt-2 font-display text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage your language, call privacy, security, login activity and account — all from one place.
      </p>

      {/* Language */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Language</p>
        <h2 className="mt-2 font-display text-xl flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" /> App language
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose how the app is displayed for you. Your preference is saved across devices.
        </p>
        <div className="mt-4">
          <LanguageSelector />
        </div>
      </section>

      {/* Online presence */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Online presence</p>
        <h2 className="mt-2 font-display text-xl">Who can see when you are online</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Show my online status</p>
              <p className="text-xs text-muted-foreground">
                When off, other members will not see your last-active time or an online indicator.
              </p>
            </div>
          </div>
          <Switch
            checked={showOnline}
            disabled={!prefsLoaded}
            onCheckedChange={toggleShowOnline}
            aria-label="Show online status"
          />
        </div>
      </section>

      {/* Call privacy */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Call privacy</p>
        <h2 className="mt-2 font-display text-xl">Allow or block incoming calls</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          When turned off, matched members will not be able to call you.
        </p>

        <div className="mt-4 divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Audio calls</p>
                <p className="text-xs text-muted-foreground">Matched members can place voice calls to you.</p>
              </div>
            </div>
            <Switch
              checked={audioOn}
              disabled={!prefsLoaded}
              onCheckedChange={(v) => updateCallPref("accept_audio_calls", v)}
              aria-label="Audio calls"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Video calls</p>
                <p className="text-xs text-muted-foreground">Matched members can place video calls to you.</p>
              </div>
            </div>
            <Switch
              checked={videoOn}
              disabled={!prefsLoaded}
              onCheckedChange={(v) => updateCallPref("accept_video_calls", v)}
              aria-label="Video calls"
            />
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Verification</p>
        <h2 className="mt-2 font-display text-xl">Get your verified badge</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a government-issued ID — after our team reviews it you will receive a blue &quot;Verified&quot; badge. A disability medical proof is optional and earns a separate green badge.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <VerifCard
            title="Identity (Govt ID)"
            status={verif?.id_verification_status ?? "none"}
            note={verif?.id_verification_note ?? null}
            uploading={uploadingId}
            onPick={(f) => uploadVerificationDoc(f, "id")}
            badge={verif?.is_verified ? "Verified" : null}
          />
          <VerifCard
            title="Disability (Medical proof)"
            status={verif?.disability_verification_status ?? "none"}
            note={verif?.disability_verification_note ?? null}
            uploading={uploadingDis}
            onPick={(f) => uploadVerificationDoc(f, "disability")}
            badge={verif?.disability_verified ? "Disability verified" : null}
            optional
          />
        </div>
      </section>

      {/* Photo privacy */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Photo privacy</p>
        <h2 className="mt-2 font-display text-xl">Who can see your photos</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Private photos</p>
              <p className="text-xs text-muted-foreground">
                When on, your photos appear blurred. Members can press &quot;Request photo access&quot; and you can approve or reject each request here. Matched members can always see your photos.
              </p>
            </div>
          </div>
          <Switch
            checked={verif?.photos_private ?? false}
            disabled={!verif}
            onCheckedChange={togglePhotosPrivate}
            aria-label="Private photos"
          />
        </div>

        {incomingReqs.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Incoming requests ({incomingReqs.length})
            </p>
            <ul className="mt-2 divide-y divide-border">
              {incomingReqs.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-secondary">
                    {r.requester_avatar ? (
                      <img src={r.requester_avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/profile/$id"
                      params={{ id: r.requester_id }}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {r.requester_name ?? "Member"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => decidePhotoReq(r.id, "reject")}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button size="sm" className="rounded-full" onClick={() => decidePhotoReq(r.id, "approve")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Last login summary */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last login</p>
        {lastLogin ? (
          <div className="mt-2">
            <p className="font-display text-xl">
              {new Date(lastLogin.created_at).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastLogin.device_label ?? "Unknown device"}
              {lastLogin.ip ? ` · IP ${lastLogin.ip}` : ""}
              {lastLogin.city || lastLogin.country
                ? ` · ${[lastLogin.city, lastLogin.country].filter(Boolean).join(", ")}`
                : ""}
            </p>
            {previousLogin && (
              <p className="mt-2 text-xs text-muted-foreground">
                Before that: {new Date(previousLogin.created_at).toLocaleString()} · {previousLogin.device_label}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No login records yet.</p>
        )}
      </section>

      {suspiciousCount > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700">{suspiciousCount} suspicious sign-in detected</p>
            <p className="mt-1 text-muted-foreground">
              If this was not you, press &quot;Logout from all devices&quot; below and change your password.
            </p>
          </div>
        </div>
      )}

      {/* Login history */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Login history</p>
          <p className="text-xs text-muted-foreground">{loading ? "Loading…" : `${rows.length} entries`}</p>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {rows.length === 0 && !loading && (
            <li className="py-4 text-sm text-muted-foreground">No history found.</li>
          )}
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  {r.device_label ?? "Unknown device"}
                  {r.is_suspicious && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                      Suspicious
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                  {r.ip ? ` · ${r.ip}` : ""}
                </p>
                {(r.city || r.country) && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {[r.city, r.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={r.is_trusted ? "default" : "outline"}
                className="rounded-full"
                onClick={() => toggleTrust(r.id, !r.is_trusted)}
              >
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {r.is_trusted ? "Trusted" : "Mark trusted"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sessions */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sessions</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Press this button to immediately sign out of every device (phone, computer, browser).
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-full"
          disabled={busy}
          onClick={() => setConfirmLogoutAll(true)}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout from all devices
        </Button>
      </section>

      <PasswordSection />

      {/* More */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-2">
        <SettingLink to="/verification" icon={BadgeCheck} label="Verification status" sub="Track your identity and disability verification" />
        <SettingLink to="/support" icon={LifeBuoy} label="Help & Support" sub="Open a ticket and talk to our team" />
        <SettingLink to="/faq" icon={HelpCircle} label="FAQ" sub="Answers to the most common questions" />
        <SettingLink to="/guidelines" icon={BookOpen} label="Community guidelines" sub="Rules for safe and respectful behaviour" />
      </section>

      {/* Danger zone — always last */}
      <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-[10px] uppercase tracking-widest text-destructive">Danger zone</p>
        <h2 className="mt-2 font-display text-xl">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your profile, photos, interests and messages will be permanently deleted. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          className="mt-4 rounded-full"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete my account
        </Button>
      </section>

      <AlertDialog open={confirmLogoutAll} onOpenChange={setConfirmLogoutAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out everywhere and will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll} disabled={busy}>
              Yes, logout everywhere
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your entire data — profile, photos, messages and matches — will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function VerifCard({
  title, status, note, uploading, onPick, badge, optional,
}: {
  title: string;
  status: VerifStatus;
  note: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  badge: string | null;
  optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {title}
            {optional && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Optional</span>
            )}
          </p>
          <StatusPill status={status} />
        </div>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <BadgeCheck className="h-3 w-3" /> {badge}
          </span>
        )}
      </div>
      {note && status === "rejected" && (
        <p className="mt-2 flex items-start gap-1 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3" /> {note}
        </p>
      )}
      <label className="mt-3 inline-flex">
        <input
          type="file"
          accept="image/*,application/pdf"
          hidden
          disabled={uploading || status === "pending"}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
        <span
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs ${
            uploading || status === "pending" ? "pointer-events-none opacity-60" : "hover:bg-secondary"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : status === "verified" ? "Re-upload" : status === "pending" ? "Pending review" : "Upload document"}
        </span>
      </label>
      <p className="mt-2 text-[10px] text-muted-foreground">JPG, PNG or PDF up to 5 MB. Only admins can view this document.</p>
    </div>
  );
}

function StatusPill({ status }: { status: VerifStatus }) {
  const map = {
    none:     { label: "Not submitted", icon: Upload,     cls: "bg-secondary text-muted-foreground" },
    pending:  { label: "Under review",  icon: Clock,      cls: "bg-amber-500/15 text-amber-700" },
    verified: { label: "Verified",      icon: BadgeCheck, cls: "bg-primary/10 text-primary" },
    rejected: { label: "Rejected",      icon: AlertCircle, cls: "bg-destructive/10 text-destructive" },
  } as const;
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

function SettingLink({
  to, icon: Icon, label, sub,
}: {
  to: "/verification" | "/support" | "/faq" | "/guidelines";
  icon: typeof BadgeCheck;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function PasswordSection() {
  const { user } = useAuth();
  const isGoogleUser = !!(user?.app_metadata as { provider?: string } | undefined)?.provider &&
    (user?.app_metadata as { provider?: string }).provider !== "email";
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) {
      toast.error("No email on file for this account.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    // For email users, verify current password by re-authenticating.
    if (!isGoogleUser) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPwd,
      });
      if (verifyErr) {
        setBusy(false);
        toast.error("Current password is incorrect.");
        return;
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      isGoogleUser
        ? "Password set! You can now sign in with email and password too."
        : "Password updated.",
    );
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Security</p>
      <h2 className="mt-2 font-display text-xl flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-muted-foreground" />
        {isGoogleUser ? "Set a password" : "Change password"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {isGoogleUser
          ? "You signed up with Google. Set a password so you can also sign in with your email."
          : "Update the password you use to sign in. We will verify your current password first."}
      </p>

      <form onSubmit={handleChange} className="mt-4 grid gap-3 sm:max-w-md">
        {!isGoogleUser && (
          <div className="space-y-1.5">
            <Label htmlFor="oldPwd">Current password</Label>
            <Input
              id="oldPwd"
              type="password"
              autoComplete="current-password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              required
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="newPwd">New password</Label>
          <Input
            id="newPwd"
            type="password"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPwd">Confirm new password</Label>
          <Input
            id="confirmPwd"
            type="password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? "Saving…" : isGoogleUser ? "Set password" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}