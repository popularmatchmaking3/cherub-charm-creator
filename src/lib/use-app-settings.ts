import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setRingVariant, setConnectVariant, setCustomSound } from "@/lib/click-sound";

export interface AppSettings {
  maintenance_mode: boolean;
  calls_enabled: boolean;
  payments_enabled: boolean;
  signups_enabled: boolean;
  membership_enabled: boolean;
  maintenance_message: string;
  ring_sound: "classic" | "bell" | "chime" | "soft";
  connect_sound: "beep" | "ding" | "chord" | "pop";
  outgoing_ring_url: string | null;
  incoming_ring_url: string | null;
  connect_url: string | null;
  disconnect_url: string | null;
  review_pending_message: string;
  review_rejected_message: string;
  review_approved_welcome: string;
  daily_message_limit_free: number;
  daily_message_limit_premium: number;
}

const DEFAULTS: AppSettings = {
  maintenance_mode: false,
  calls_enabled: true,
  payments_enabled: false,
  signups_enabled: true,
  membership_enabled: false,
  maintenance_message: "",
  ring_sound: "classic",
  connect_sound: "beep",
  outgoing_ring_url: null,
  incoming_ring_url: null,
  connect_url: null,
  disconnect_url: null,
  review_pending_message:
    "Aapka account abhi review mein hai. Hamari team aapki profile verify kar rahi hai. Kripya intezaar karein — aapko jald hi notify kiya jayega.",
  review_rejected_message:
    "Hume khed hai — aapka account abhi approve nahi kiya gaya. Aap appeal page se sampark kar sakte hain.",
  review_approved_welcome:
    "Aapka account approve ho gaya hai. United Disabled Matrimony mein swagat hai!",
  daily_message_limit_free: 20,
  daily_message_limit_premium: 200,
};

let cache: AppSettings | null = null;
const listeners = new Set<(s: AppSettings) => void>();
let subscribed = false;

async function signPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const { data } = await supabase.storage.from("call-sounds")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? null;
  } catch { return null; }
}

async function setAll(s: AppSettings) {
  const [o, i, c, d] = await Promise.all([
    signPath(s.outgoing_ring_url), signPath(s.incoming_ring_url),
    signPath(s.connect_url), signPath(s.disconnect_url),
  ]);
  s = { ...s, outgoing_ring_url: o, incoming_ring_url: i, connect_url: c, disconnect_url: d };
  cache = s;
  try {
    setRingVariant(s.ring_sound); setConnectVariant(s.connect_sound);
    setCustomSound("outgoingRing", o);
    setCustomSound("incomingRing", i);
    setCustomSound("connect", c);
    setCustomSound("disconnect", d);
  } catch { /* noop */ }
  listeners.forEach((l) => l(s));
}

async function fetchOnce() {
  const { data } = await supabase.from("app_settings")
    .select("maintenance_mode, calls_enabled, payments_enabled, signups_enabled, membership_enabled, maintenance_message, ring_sound, connect_sound, outgoing_ring_url, incoming_ring_url, connect_url, disconnect_url, review_pending_message, review_rejected_message, review_approved_welcome, daily_message_limit_free, daily_message_limit_premium")
    .eq("id", 1).maybeSingle();
  if (data) setAll(data as AppSettings);
}

function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  fetchOnce();
  supabase.channel("app-settings")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      (payload) => {
        const row = payload.new as AppSettings | undefined;
        if (row) setAll(row);
      })
    .subscribe();
}

export function useAppSettings(): AppSettings {
  const [s, setS] = useState<AppSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    ensureSubscribed();
    listeners.add(setS);
    if (cache) setS(cache);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}

export async function refreshAppSettings() {
  await fetchOnce();
}