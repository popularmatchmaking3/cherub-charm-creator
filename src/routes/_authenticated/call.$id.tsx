import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Ban, Flag } from "lucide-react";
import { useAppSettings } from "@/lib/use-app-settings";
import { playCallConnected, playCallDisconnected, startOutgoingRing, stopIncomingRing } from "@/lib/click-sound";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/call/$id")({
  head: () => ({ meta: [{ title: "Call — United Disabled Matrimony" }] }),
  component: CallPage,
});

interface CallRow {
  id: string;
  caller_id: string;
  callee_id: string;
  type: "audio" | "video";
  status: "ringing" | "accepted" | "declined" | "ended" | "missed";
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function CallPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [call, setCall] = useState<CallRow | null>(null);
  const [otherName, setOtherName] = useState<string>("");
  const [status, setStatus] = useState<string>("Connecting…");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const isCallerRef = useRef(false);
  const connectedBeepPlayedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!settings.calls_enabled) {
      toast.error("Calls are temporarily disabled");
      navigate({ to: "/messages" });
      return;
    }
    let cleanup = () => {};
    let mounted = true;
    let missedTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const { data: row, error } = await supabase.from("calls")
        .select("*").eq("id", id).maybeSingle();
      if (!row || error) { toast.error("Call not found"); navigate({ to: "/messages" }); return; }
      if (row.caller_id !== user.id && row.callee_id !== user.id) {
        toast.error("Not your call"); navigate({ to: "/messages" }); return;
      }
      if (row.status === "ended" || row.status === "declined" || row.status === "missed") {
        toast.info("Call already ended"); navigate({ to: "/messages" }); return;
      }
      if (!mounted) return;
      setCall(row as CallRow);
      isCallerRef.current = row.caller_id === user.id;
      const otherId = isCallerRef.current ? row.callee_id : row.caller_id;
      const { data: prof } = await supabase.from("profiles")
        .select("full_name").eq("id", otherId).maybeSingle();
      if (mounted) setOtherName(prof?.full_name ?? "Member");

      // Get media
      const wantVideo = row.type === "video";
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true, video: wantVideo,
        });
      } catch (e) {
        toast.error("Mic/camera access denied");
        await supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
        navigate({ to: "/messages" });
        return;
      }
      if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current && wantVideo) localVideoRef.current.srcObject = stream;

      // Peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const remoteStream = new MediaStream();
      pc.ontrack = (ev) => {
        ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        if (wantVideo && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        stopIncomingRing();
        if (!connectedBeepPlayedRef.current) {
          connectedBeepPlayedRef.current = true;
          playCallConnected();
        }
        setStatus("Connected");
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("Connected");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("Disconnected");
        }
      };

      // Signaling channel
      const channel = supabase.channel(`call:${id}`, { config: { broadcast: { self: false } } });
      channelRef.current = channel;

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          channel.send({ type: "broadcast", event: "ice", payload: { candidate: ev.candidate.toJSON() } });
        }
      };

      async function sendOfferFromCaller() {
        if (!isCallerRef.current || pc.localDescription || pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
      }

      channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (isCallerRef.current) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
      });
      channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (!isCallerRef.current) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });
      channel.on("broadcast", { event: "ice" }, async ({ payload }) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      });
      channel.on("broadcast", { event: "ready" }, async () => {
        if (!isCallerRef.current) return;
        await sendOfferFromCaller();
      });

      // Listen for status updates on the call row
      const dbChannel = supabase.channel(`call-row:${id}`)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${id}` },
          (payload) => {
            const nr = payload.new as CallRow;
            setCall(nr);
            if (nr.status === "accepted") {
              stopIncomingRing();
              if (!connectedBeepPlayedRef.current) {
                connectedBeepPlayedRef.current = true;
                playCallConnected();
              }
              setStatus("Connecting…");
              sendOfferFromCaller().catch(() => {});
            }
            if (nr.status === "declined") { toast.info("Call declined"); hangup(false); }
            if (nr.status === "missed") { toast.info("Call not answered"); hangup(false); }
            if (nr.status === "ended") { hangup(false); }
          })
        .subscribe();

      channel.subscribe(async (s) => {
        if (s !== "SUBSCRIBED") return;
        if (isCallerRef.current) {
          setStatus(row.status === "accepted" ? "Connecting…" : "Ringing…");
          if (row.status === "ringing") startOutgoingRing();
          if (row.status === "accepted") sendOfferFromCaller().catch(() => {});
          missedTimer = setTimeout(async () => {
            if (pc.connectionState === "connected") return;
            await supabase
              .from("calls")
              .update({ status: "missed", ended_at: new Date().toISOString() })
              .eq("id", id);
          }, 60_000);
          // Wait for callee to send "ready"
        } else {
          // Callee: mark accepted, announce ready
          await supabase.from("calls").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", id);
          channel.send({ type: "broadcast", event: "ready", payload: {} });
          setStatus("Connecting…");
        }
      });

      async function hangup(updateDb: boolean) {
        try { stopIncomingRing(); } catch {}
        try { playCallDisconnected(); } catch {}
        try { pc.getSenders().forEach((s) => s.track?.stop()); } catch {}
        try { pc.close(); } catch {}
        try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
        try { await supabase.removeChannel(channel); } catch {}
        try { await supabase.removeChannel(dbChannel); } catch {}
        if (updateDb) {
          await supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
        }
        navigate({ to: "/messages" });
      }
      // expose hangup to outer scope via channelRef hack
      (channelRef as any).hangup = hangup;

      cleanup = () => {
        stopIncomingRing();
        if (missedTimer) clearTimeout(missedTimer);
        try { pc.close(); } catch {}
        try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
        supabase.removeChannel(channel);
        supabase.removeChannel(dbChannel);
      };
    })();

    return () => { mounted = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };
  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setCamOff((c) => !c);
  };
  const endCall = () => {
    stopIncomingRing();
    const fn = (channelRef as any).hangup as undefined | ((u: boolean) => Promise<void>);
    if (fn) fn(true); else navigate({ to: "/messages" });
  };

  async function blockUser() {
    if (!user || !call) return;
    const otherId = call.caller_id === user.id ? call.callee_id : call.caller_id;
    if (!confirm(`Block ${otherName}? Neither of you will be able to message or call each other.`)) return;
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: otherId });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    toast.success(`Blocked ${otherName}.`);
    endCall();
  }

  async function submitReport() {
    if (!user || !call) return;
    const reason = reportReason.trim();
    if (!reason) { toast.error("A reason is required."); return; }
    const otherId = call.caller_id === user.id ? call.callee_id : call.caller_id;
    setSubmitting(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: user.id, reported_id: otherId, reason,
      category: "other",
      context: "call",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. The admin team will review it.");
    setReportOpen(false);
    setReportReason("");
  }

  const isVideo = call?.type === "video";

  return (
    <main className="mx-auto flex h-[calc(100vh-65px)] max-w-4xl flex-col items-center justify-between px-4 py-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {isVideo ? "Video call" : "Audio call"}
        </p>
        <h1 className="mt-2 font-display text-3xl">{otherName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{status}</p>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center py-6">
        {isVideo ? (
          <>
            <video ref={remoteVideoRef} autoPlay playsInline
              className="h-full max-h-[60vh] w-full rounded-2xl bg-black object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted
              className="absolute bottom-4 right-4 h-32 w-24 rounded-xl border-2 border-card bg-black object-cover" />
          </>
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-secondary font-display text-6xl">
            {otherName.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <audio ref={remoteAudioRef} autoPlay />
      </div>

      <div className="flex flex-wrap items-start justify-center gap-5">
        <CallAction label={muted ? "Unmute" : "Mute"} onClick={toggleMute}
          variant={muted ? "default" : "outline"}>
          {muted ? <MicOff /> : <Mic />}
        </CallAction>
        {isVideo && (
          <CallAction label={camOff ? "Camera on" : "Camera off"} onClick={toggleCam}
            variant={camOff ? "default" : "outline"}>
            {camOff ? <VideoOff /> : <Video />}
          </CallAction>
        )}
        <CallAction label="End call" onClick={endCall} variant="destructive">
          <PhoneOff />
        </CallAction>
        <CallAction label="Block" onClick={blockUser} variant="outline">
          <Ban />
        </CallAction>
        <CallAction label="Report" onClick={() => setReportOpen(true)} variant="outline">
          <Flag />
        </CallAction>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {otherName}</DialogTitle>
            <DialogDescription>
              What's the issue? The admin team will review it.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the reason (e.g. abusive language, fake profile)…"
            rows={4}
            className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
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

function CallAction({
  label, onClick, variant, children,
}: {
  label: string;
  onClick: () => void;
  variant: "default" | "outline" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-16 flex-col items-center gap-1.5">
      <Button variant={variant} size="icon" className="h-14 w-14 rounded-full" onClick={onClick}
        aria-label={label}>
        {children}
      </Button>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}