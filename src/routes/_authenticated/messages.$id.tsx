import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Phone, Video, Send } from "lucide-react";
import { useAppSettings } from "@/lib/use-app-settings";
import { playMessageSent, playMessageReceived } from "@/lib/click-sound";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Chat — United Disabled Matrimony" }] }),
  component: ChatPage,
});

interface Msg { id: string; sender_id: string; content: string; created_at: string }

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const settings = useAppSettings();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [other, setOther] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = Route.useNavigate();
  const [otherId, setOtherId] = useState<string | null>(null);
  const [sentToday, setSentToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const tz = (typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const { data: conv } = await supabase.from("conversations")
        .select("user1_id, user2_id").eq("id", id).maybeSingle();
      if (!conv) return;
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      if (mounted) setOtherId(otherId);
      const { data: prof } = await supabase.from("profiles")
        .select("full_name, avatar_url, membership_tier, daily_message_limit_override")
        .eq("id", otherId).maybeSingle();
      if (mounted) setOther(prof);

      // My own tier + override for limit
      const { data: mine } = await supabase.from("profiles")
        .select("membership_tier, daily_message_limit_override")
        .eq("id", user.id).maybeSingle();
      const mineRow = (mine ?? {}) as { membership_tier?: string; daily_message_limit_override?: number | null };
      const limit = mineRow.daily_message_limit_override
        ?? (mineRow.membership_tier === "premium"
          ? settings.daily_message_limit_premium
          : settings.daily_message_limit_free);
      if (mounted) setDailyLimit(limit);

      // Today's count (in user's local day — approx via UTC midnight is fine)
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("messages")
        .select("id", { head: true, count: "exact" })
        .eq("sender_id", user.id)
        .gte("created_at", since.toISOString());
      if (mounted) setSentToday(count ?? 0);

      const { data: msgs } = await supabase.from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", id).order("created_at");
      if (mounted) setMessages((msgs ?? []) as Msg[]);
    })();

    const channel = supabase.channel(`messages:${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_id !== user.id) {
            try { playMessageReceived(); } catch { /* noop */ }
          }
        })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [id, user, settings.daily_message_limit_free, settings.daily_message_limit_premium]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const content = text.trim();
    if (!content || !user) return;
    if (dailyLimit !== null && sentToday >= dailyLimit) {
      toast.error(`Aapki daily message limit (${dailyLimit}) khatam ho gayi. Kal phir try karein.`);
      return;
    }
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages")
      .insert({ conversation_id: id, sender_id: user.id, content });
    setSending(false);
    if (error) { toast.error(error.message); setText(content); return; }
    setSentToday((n) => n + 1);
    try { playMessageSent(); } catch { /* noop */ }
  }

  async function startCall(type: "audio" | "video") {
    if (!user || !otherId) return;
    const { data, error } = await supabase.from("calls")
      .insert({ caller_id: user.id, callee_id: otherId, type })
      .select("id").single();
    if (error || !data) { toast.error(error?.message ?? "Could not start call"); return; }
    navigate({ to: "/call/$id", params: { id: data.id } });
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-72px)] max-w-3xl flex-col px-4 pb-[env(safe-area-inset-bottom)] pt-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
        <Link to="/messages" className="rounded-full p-2 hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-secondary">
          {other?.avatar_url ? (
            <img src={other.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-muted-foreground">
              {(other?.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate font-display text-lg">{other?.full_name ?? "Chat"}</p>
        <div className="ml-auto flex shrink-0 gap-2">
          {settings.calls_enabled && (
            <>
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => startCall("audio")} title="Audio call" data-sound="call">
                <Phone className="h-4 w-4" /> Audio call
              </Button>
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => startCall("video")} title="Video call" data-sound="call">
                <Video className="h-4 w-4" /> Video call
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Say hello 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          const time = new Date(m.created_at).toLocaleTimeString([], {
            hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz,
          });
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${mine
                ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {m.content}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted-foreground">{time}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {dailyLimit !== null && (
        <p className="px-1 pb-1 text-right text-[11px] text-muted-foreground">
          {sentToday}/{dailyLimit} messages today
        </p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background pb-3 pt-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
          autoComplete="off"
          rows={2}
          aria-label="Message"
          className="min-h-[56px] min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" disabled={sending || !text.trim()}
          className="h-[56px] shrink-0 rounded-2xl px-6 text-base">
          <Send className="mr-2 h-5 w-5" /> Send
        </Button>
      </form>
    </main>
  );
}