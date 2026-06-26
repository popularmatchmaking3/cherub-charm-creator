import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle, Phone, Video, Heart, Check, Lock, Ban, Flag,
  MoreVertical, BadgeCheck, ImageOff, X, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/profile-options";
import { useAppSettings } from "@/lib/use-app-settings";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  acceptInterestAndEnsureConversation,
  ensureConversation,
  getConnectionState,
  sendInterest,
  startMatchedCall,
  withdrawInterest,
  type ConnectionState,
} from "@/lib/match-actions";
import { REPORT_CATEGORIES } from "@/lib/report-categories";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  head: () => ({ meta: [{ title: "Profile — United Disabled Matrimony" }] }),
  component: MemberProfilePage,
});

interface Profile {
  id: string;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  disability_category: string | null;
  disability_percentage: number | null;
  religion: string | null;
  mother_tongue: string | null;
  marital_status: string | null;
  education: string | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  about: string | null;
  partner_preferences: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  disability_verified: boolean;
  photos_private: boolean;
  block_disabled?: boolean;
  report_disabled?: boolean;
}

type PhotoAccessState = "none" | "pending" | "approved" | "rejected";

function MemberProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("none");
  const [incomingId, setIncomingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [reportEvidence, setReportEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoAccess, setPhotoAccess] = useState<PhotoAccessState>("none");

  useEffect(() => {
    if (!user) return;
    if (id === user.id) {
      navigate({ to: "/profile", replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      const [{ data: p }, state, { data: blk }, { data: req }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        getConnectionState(user.id, id).catch(() => ({ state: "none" as const, incomingId: null })),
        supabase.from("user_blocks").select("id")
          .eq("blocker_id", user.id).eq("blocked_id", id).maybeSingle(),
        supabase.from("photo_access_requests").select("status")
          .eq("requester_id", user.id).eq("owner_id", id).maybeSingle(),
      ]);
      if (!mounted) return;
      setProfile(p as Profile | null);
      setConnection(state.state);
      setIncomingId(state.incomingId);
      setBlocked(!!blk);
      setPhotoAccess(((req?.status as PhotoAccessState | undefined) ?? "none"));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id, user, navigate]);

  async function refreshState() {
    if (!user) return;
    const state = await getConnectionState(user.id, id);
    setConnection(state.state);
    setIncomingId(state.incomingId);
  }

  async function requestPhotoAccess() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("photo_access_requests")
      .insert({ requester_id: user.id, owner_id: id });
    setBusy(false);
    if (error) {
      if (error.message.includes("duplicate")) {
        toast.info("You've already sent a request.");
        setPhotoAccess("pending");
      } else { toast.error(error.message); }
      return;
    }
    toast.success("Photo access request sent.");
    setPhotoAccess("pending");
  }

  async function cancelPhotoAccess() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("photo_access_requests").delete()
      .eq("requester_id", user.id).eq("owner_id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request cancelled.");
    setPhotoAccess("none");
  }

  async function doWithdrawInterest() {
    if (!user) return;
    setBusy(true);
    try {
      await withdrawInterest(user.id, id);
      setConnection("none");
      toast.success("Interest withdrawn.");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  async function requestInterest() {
    if (!user) return;
    setBusy(true);
    try {
      const next = await sendInterest(user.id, id);
      setConnection(next.state === "none" ? "sent" : next.state);
      setIncomingId(next.incomingId);
      if (next.state === "received") {
        toast.info("They've sent you an interest. Accept it to unlock messaging and calls.");
      } else if (next.state === "matched") {
        toast.success("You're already matched. You can message or call now.");
      } else {
        toast.success("Interest sent. Messaging will unlock once they accept.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  async function blockUser() {
    if (!user) return;
    if (!confirm(`Block ${profile?.full_name ?? "this member"}? Neither of you will be able to message or call each other.`)) return;
    setBusy(true);
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: id });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message); return;
    }
    toast.success("Blocked.");
    setBlocked(true);
  }

  async function unblockUser() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("user_blocks").delete()
      .eq("blocker_id", user.id).eq("blocked_id", id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Unblocked.");
    setBlocked(false);
  }

  async function submitReport() {
    if (!user) return;
    if (!reportCategory) { toast.error("Please select a category first."); return; }
    const reason = reportReason.trim() || REPORT_CATEGORIES.find((c) => c.value === reportCategory)?.label || "Report";
    setSubmitting(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: user.id, reported_id: id, reason,
      category: reportCategory,
      evidence: reportEvidence.trim() || null,
      context: "profile",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. The admin team will review it.");
    setReportOpen(false);
    setReportCategory("");
    setReportReason("");
    setReportEvidence("");
  }

  async function acceptAndMessage() {
    if (!user || !incomingId) return;
    setBusy(true);
    try {
      const convId = await acceptInterestAndEnsureConversation(incomingId, user.id, id);
      toast.success("Match unlocked. Start chatting.");
      navigate({ to: "/messages/$id", params: { id: convId } });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  async function openChat() {
    if (!user) return;
    if (connection !== "matched") {
      toast.info(
        connection === "sent" ? "You need their acceptance first." : "Please send an interest first.",
      );
      return;
    }
    setBusy(true);
    try {
      const convId = await ensureConversation(user.id, id);
      navigate({ to: "/messages/$id", params: { id: convId } });
    } catch (e) {
      toast.error((e as Error).message);
      await refreshState().catch(() => {});
    }
    setBusy(false);
  }

  async function call(type: "audio" | "video") {
    if (!user) return;
    if (connection !== "matched") {
      toast.info(
        connection === "sent"
          ? "Calls unlock once they accept."
          : "Please send an interest first.",
      );
      return;
    }
    if (!settings.calls_enabled) {
      toast.info("Calls are currently disabled.");
      return;
    }
    setBusy(true);
    try {
      const callId = await startMatchedCall(user.id, id, type);
      navigate({ to: "/call/$id", params: { id: callId } });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  if (loading) return <div className="px-6 py-10 text-muted-foreground">Loading…</div>;
  if (!profile) return <div className="px-6 py-10 text-muted-foreground">Profile not found.</div>;

  const age = profile.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  const photoUnlocked =
    !profile.photos_private || connection === "matched" || photoAccess === "approved";
  const showPhoto = profile.avatar_url && photoUnlocked;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full" aria-label="More options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {profile.photos_private && connection !== "matched" && (
              photoAccess === "none" || photoAccess === "rejected" ? (
                <DropdownMenuItem onClick={requestPhotoAccess} disabled={busy}>
                  <ImageOff className="mr-2 h-4 w-4" /> Request photo access
                </DropdownMenuItem>
              ) : photoAccess === "pending" ? (
                <DropdownMenuItem onClick={cancelPhotoAccess} disabled={busy}>
                  <Clock className="mr-2 h-4 w-4" /> Cancel photo request
                </DropdownMenuItem>
              ) : null
            )}
            {connection === "sent" && (
              <DropdownMenuItem onClick={doWithdrawInterest} disabled={busy}>
                <X className="mr-2 h-4 w-4" /> Withdraw interest
              </DropdownMenuItem>
            )}
            {!profile.block_disabled && (
              <DropdownMenuItem onClick={blocked ? unblockUser : blockUser} disabled={busy}>
                <Ban className="mr-2 h-4 w-4" /> {blocked ? "Unblock user" : "Block user"}
              </DropdownMenuItem>
            )}
            {!profile.report_disabled && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                  <Flag className="mr-2 h-4 w-4" /> Report user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <section className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[4/5] bg-secondary">
            {showPhoto ? (
              <img
                src={profile.avatar_url ?? undefined}
                alt={profile.full_name ?? "Profile"}
                className="h-full w-full object-cover"
              />
            ) : profile.avatar_url ? (
              <>
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover blur-2xl scale-110"
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 p-4 text-center">
                  <Lock className="h-6 w-6 text-foreground" />
                  <p className="text-sm font-medium">Photos are private</p>
                  {photoAccess === "pending" ? (
                    <p className="text-xs text-muted-foreground">Request pending…</p>
                  ) : photoAccess === "approved" ? null : (
                    <Button size="sm" variant="outline" className="rounded-full"
                      onClick={requestPhotoAccess} disabled={busy}>
                      Request access
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-7xl text-muted-foreground">
                {(profile.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-3 p-4">
            {connection === "received" ? (
              <Button
                className="w-full rounded-full"
                disabled={busy}
                onClick={acceptAndMessage}
                data-sound="success"
              >
                <Check className="h-4 w-4" /> Accept & message
              </Button>
            ) : connection === "none" ? (
              <Button
                className="w-full rounded-full"
                disabled={busy}
                onClick={requestInterest}
                data-sound="send"
              >
                <Heart className="h-4 w-4" /> Send interest
              </Button>
            ) : (
              <Button className="w-full rounded-full" variant="outline" disabled>
                <Lock className="h-4 w-4" />{" "}
                {connection === "matched" ? "Profile unlocked" : "Interest sent"}
              </Button>
            )}
            <Button
              className="w-full rounded-full"
              variant={connection === "matched" ? "default" : "outline"}
              onClick={openChat}
              disabled={busy}
              data-sound={connection === "matched" ? "nav" : "tap"}
            >
              {connection === "matched" ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Message
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => call("audio")}
                data-sound="call"
              >
                <Phone className="h-4 w-4" /> Audio call
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => call("video")}
                data-sound="call"
              >
                <Video className="h-4 w-4" /> Video call
              </Button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Member profile
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-4xl">
            {profile.full_name ?? "Member"}
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {profile.disability_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <Heart className="h-3.5 w-3.5" /> Disability verified
              </span>
            )}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {[age ? `${age} years` : null, profile.city, profile.state, profile.country]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info
              label="Disability"
              value={`${categoryLabel(profile.disability_category)} · ${profile.disability_percentage ?? 0}%`}
            />
            <Info label="Marital status" value={cap(profile.marital_status?.replace("_", " "))} />
            <Info label="Religion" value={profile.religion || "—"} />
            <Info label="Mother tongue" value={profile.mother_tongue || "—"} />
            <Info label="Education" value={profile.education || "—"} />
            <Info label="Occupation" value={profile.occupation || "—"} />
          </div>
          {profile.about && <Section title="About">{profile.about}</Section>}
          {profile.partner_preferences && (
            <Section title="Looking for">{profile.partner_preferences}</Section>
          )}
        </div>
      </section>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {profile.full_name ?? "member"}</DialogTitle>
            <DialogDescription>Choose a category. The admin team will review it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Issue type <span className="text-destructive">*</span>
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select an issue…</option>
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Details (optional)
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Tell us a bit more about what happened…"
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Evidence (optional)
              </label>
              <input
                value={reportEvidence}
                onChange={(e) => setReportEvidence(e.target.value)}
                placeholder="Screenshot link ya extra info"
                className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} disabled={submitting}>
              {submitting ? "Sending…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-line leading-relaxed">{children}</p>
    </section>
  );
}

function cap(s?: string | null) {
  if (!s) return "—";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
