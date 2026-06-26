import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Pings touch_last_seen() so the user's profiles.last_seen_at stays fresh
 * while they have the app open. Used by the authenticated layout.
 */
export function usePresenceHeartbeat(intervalMs = 60_000) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      supabase.rpc("touch_last_seen").then(() => undefined, () => undefined);
    };
    tick();
    const id = setInterval(tick, intervalMs);
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, intervalMs]);
}

/**
 * Returns a human-readable presence label for a member.
 * - Within 2 minutes: "Active now"
 * - Within 60 minutes: "Active 12 min ago"
 * - Within 24 hours:   "Active 5 h ago"
 * - Otherwise:         "Active 3 days ago"
 * Returns null when the member has hidden their online status or never been seen.
 */
export function presenceLabel(
  lastSeenAt: string | null | undefined,
  showOnlineStatus: boolean | null | undefined,
): { label: string; online: boolean } | null {
  if (showOnlineStatus === false || !lastSeenAt) return null;
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return null;
  const diffSec = Math.max(0, Math.round((Date.now() - seen) / 1000));
  if (diffSec < 120) return { label: "Active now", online: true };
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return { label: `Active ${diffMin} min ago`, online: false };
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return { label: `Active ${diffHr} h ago`, online: false };
  const diffDay = Math.round(diffHr / 24);
  return { label: `Active ${diffDay} day${diffDay === 1 ? "" : "s"} ago`, online: false };
}