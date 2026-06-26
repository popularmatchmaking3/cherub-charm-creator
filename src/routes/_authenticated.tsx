import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Video, PhoneOff, Menu, X, Bell, ShieldCheck, LifeBuoy, HelpCircle, BadgeCheck, Settings as SettingsIcon, Search as SearchIcon, Heart } from "lucide-react";
import { useAppSettings } from "@/lib/use-app-settings";
import { playCallConnected, startIncomingRing, stopIncomingRing, useGlobalClickSound, playNotification } from "@/lib/click-sound";
import { useServerFn } from "@tanstack/react-start";
import { checkAndLogSession } from "@/lib/security.functions";
import { usePresenceHeartbeat } from "@/lib/use-presence";
import { LanguageSelector } from "@/components/language-selector";
import { useReviewStatus } from "@/lib/use-review-status";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  useGlobalClickSound();
  usePresenceHeartbeat();
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useIsAdmin();
  const settings = useAppSettings();
  const review = useReviewStatus();
  const checkSession = useServerFn(checkAndLogSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<
    { id: string; title: string; body: string; created_at: string }[]
  >([]);
  const [unread, setUnread] = useState(0);
  const [incoming, setIncoming] = useState<{
    id: string;
    type: "audio" | "video";
    caller_id: string;
    caller_name: string;
  } | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Log IP and enforce bans
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await checkSession();
        if (cancelled) return;
        if (res.banned) {
          toast.error(res.reason ?? "Account banned");
          await signOut();
          navigate({ to: "/login" });
        }
      } catch {
        /* network or unauth — ignore */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Ask for browser notification permission once
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Load notifications + realtime
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      const { data: list } = await supabase
        .from("notifications")
        .select("id,title,body,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);
      if (!mounted) return;
      const readSet = new Set((reads ?? []).map((r) => r.notification_id));
      setNotifs(list ?? []);
      setUnread((list ?? []).filter((n) => !readSet.has(n.id)).length);
    };
    load();
    const ch = supabase
      .channel("notif-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as {
            id: string;
            title: string;
            body: string;
            created_at: string;
            audience: string;
            target_user_id: string | null;
          };
          if (n.audience === "user" && n.target_user_id !== user.id) return;
          setNotifs((prev) =>
            [{ id: n.id, title: n.title, body: n.body, created_at: n.created_at }, ...prev].slice(
              0,
              20,
            ),
          );
          setUnread((u) => u + 1);
          toast(n.title, { description: n.body });
          try { playNotification(); } catch { /* noop */ }
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(n.title, { body: n.body });
            } catch {
              /* noop */
            }
          }
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const openNotifs = async () => {
    setNotifOpen((v) => !v);
    if (!user || unread === 0) return;
    const rows = notifs.map((n) => ({ notification_id: n.id, user_id: user.id }));
    await supabase
      .from("notification_reads")
      .upsert(rows, { onConflict: "notification_id,user_id" });
    setUnread(0);
  };

  useEffect(() => {
    if (!user || !settings.calls_enabled) return;
    let mounted = true;
    const showIncomingCall = async (row: {
      id: string;
      type: "audio" | "video";
      caller_id: string;
      status: string;
      created_at?: string;
    }) => {
      if (row.status !== "ringing" || row.caller_id === user.id) return;
      if (row.created_at && Date.now() - new Date(row.created_at).getTime() > 60_000) {
        await supabase
          .from("calls")
          .update({ status: "missed", ended_at: new Date().toISOString() })
          .eq("id", row.id);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", row.caller_id)
        .maybeSingle();
      if (!mounted) return;
      setIncoming({
        id: row.id,
        type: row.type,
        caller_id: row.caller_id,
        caller_name: prof?.full_name ?? "Someone",
      });
    };

    supabase
      .from("calls")
      .select("id,type,caller_id,status,created_at")
      .eq("callee_id", user.id)
      .eq("status", "ringing")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) showIncomingCall(data as { id: string; type: "audio" | "video"; caller_id: string; status: string; created_at: string });
      });

    const channel = supabase
      .channel(`incoming-calls:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` },
        (payload) => showIncomingCall(payload.new as { id: string; type: "audio" | "video"; caller_id: string; status: string; created_at: string }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `callee_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          if (row.status !== "ringing") setIncoming((prev) => (prev?.id === row.id ? null : prev));
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, settings.calls_enabled]);

  useEffect(() => {
    if (!incoming) {
      stopIncomingRing();
      return;
    }
    return startIncomingRing();
  }, [incoming]);

  const accept = () => {
    if (!incoming) return;
    const callId = incoming.id;
    stopIncomingRing();
    playCallConnected();
    setIncoming(null);
    navigate({ to: "/call/$id", params: { id: callId } });
  };
  const decline = async () => {
    if (!incoming) return;
    stopIncomingRing();
    await supabase
      .from("calls")
      .update({ status: "declined", ended_at: new Date().toISOString() })
      .eq("id", incoming.id);
    setIncoming(null);
  };

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (settings.maintenance_mode && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">United Disabled Matrimony</p>
        <h1 className="mt-3 font-display text-4xl">Under maintenance</h1>
        <p className="mt-4 max-w-md text-muted-foreground">{settings.maintenance_message}</p>
        <Button
          variant="outline"
          className="mt-6 rounded-full"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  // Account review gate — pending/rejected users are limited to a small set of routes.
  // Admins bypass.
  const REVIEW_ALLOWLIST = [
    "/under-review",
    "/onboarding",
    "/settings",
    "/appeal",
    "/contact",
    "/support",
    "/faq",
    "/terms",
    "/privacy",
    "/data-protection",
    "/guidelines",
  ];
  const inAllowlist = REVIEW_ALLOWLIST.some((p) => location.pathname.startsWith(p));
  useEffect(() => {
    if (review.loading || isAdmin) return;
    if (review.status && review.status !== "approved" && !inAllowlist) {
      navigate({ to: "/under-review" });
    }
  }, [review.loading, review.status, isAdmin, inAllowlist, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-display text-2xl">
            United Disabled Matrimony
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link
              to="/dashboard"
              className={
                location.pathname === "/dashboard"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Browse
            </Link>
            <Link
              to="/recommendations"
              className={
                location.pathname.startsWith("/recommendations")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Daily Picks
            </Link>
            <Link
              to="/search"
              className={
                location.pathname.startsWith("/search")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Search
            </Link>
            <Link
              to="/matches"
              className={
                location.pathname.startsWith("/matches")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Matches
            </Link>
            <Link
              to="/messages"
              className={
                location.pathname.startsWith("/messages")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Messages
            </Link>
            {settings.membership_enabled && (
              <Link
                to="/membership"
                className={
                  location.pathname.startsWith("/membership")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Membership
              </Link>
            )}
            <Link
              to="/stories"
              className={
                location.pathname.startsWith("/stories")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              Stories
            </Link>
            <Link
              to="/profile"
              className={
                location.pathname === "/profile"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              My Profile
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={
                  location.pathname.startsWith("/admin")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <LanguageSelector compact />
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Admin panel"
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-2 text-xs font-medium text-primary md:hidden"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            <button
              type="button"
              aria-label="Notifications"
              onClick={openNotifs}
              className="relative rounded-full border border-border p-2"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-full md:inline-flex"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-full border border-border p-2 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {notifOpen && (
          <div className="border-t border-border bg-card">
            <div className="mx-auto max-w-6xl px-6 py-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Notifications
              </p>
              <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                {notifs.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
                {notifs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}
              </ul>
            </div>
          </div>
        )}
        {menuOpen && (
          <div className="border-t border-border bg-card md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col px-6 py-3 text-sm">
              <Link to="/dashboard" className="py-2 text-foreground">
                Browse
              </Link>
              <Link to="/recommendations" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> Daily Picks</span>
              </Link>
              <Link to="/search" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><SearchIcon className="h-4 w-4" /> Search</span>
              </Link>
              <Link to="/matches" className="py-2 text-foreground">
                Matches
              </Link>
              <Link to="/messages" className="py-2 text-foreground">
                Messages
              </Link>
              {settings.membership_enabled && (
                <Link to="/membership" className="py-2 text-foreground">
                  Membership
                </Link>
              )}
              <Link to="/suggestions" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2">💡 Suggest a feature</span>
              </Link>
              <Link to="/stories" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" /> Success Stories</span>
              </Link>
              <Link to="/profile" className="py-2 text-foreground">
                My Profile
              </Link>
              <Link to="/settings" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Settings</span>
              </Link>
              <Link to="/verification" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> Verification status</span>
              </Link>
              <Link to="/support" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Help &amp; Support</span>
              </Link>
              <Link to="/faq" className="py-2 text-foreground">
                <span className="inline-flex items-center gap-2"><HelpCircle className="h-4 w-4" /> FAQ</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="py-2 font-medium text-primary">
                  Admin Panel
                </Link>
              )}
              <button
                className="mt-2 rounded-full border border-border py-2 text-left text-foreground"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <span className="px-3">Sign out</span>
              </button>
            </nav>
          </div>
        )}
      </header>
      <Outlet />

      {incoming && (
        <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl sm:left-auto sm:right-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Incoming {incoming.type} call
          </p>
          <p className="mt-1 font-display text-xl">{incoming.caller_name}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="destructive" className="flex-1 rounded-full" onClick={decline}>
              <PhoneOff className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button className="flex-1 rounded-full" onClick={accept}>
              {incoming.type === "video" ? (
                <Video className="mr-2 h-4 w-4" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
