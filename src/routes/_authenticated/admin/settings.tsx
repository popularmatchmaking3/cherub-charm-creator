import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, refreshAppSettings } from "@/lib/use-app-settings";
import { updateAppSettings } from "@/lib/admin.functions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Play, Upload, Trash2 } from "lucide-react";
import { playIncomingRing, playCallConnected, playCallDisconnected, setRingVariant, setConnectVariant } from "@/lib/click-sound";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const s = useAppSettings();
  const update = useServerFn(updateAppSettings);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggle(field: keyof typeof s, value: boolean) {
    await update({ data: { [field]: value } }).then(() => {
      toast.success("Updated");
      refreshAppSettings();
    }).catch((e: Error) => toast.error(e.message));
  }

  async function saveMessage() {
    setSaving(true);
    try {
      await update({ data: { maintenance_message: msg ?? s.maintenance_message } });
      toast.success("Message saved");
      refreshAppSettings();
      setMsg(null);
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  }

  async function saveSound(field: "ring_sound" | "connect_sound", value: string) {
    await update({ data: { [field]: value } }).then(() => {
      toast.success("Saved");
      if (field === "ring_sound") setRingVariant(value as "classic" | "bell" | "chime" | "soft");
      else setConnectVariant(value as "beep" | "ding" | "chord" | "pop");
      refreshAppSettings();
    }).catch((e: Error) => toast.error(e.message));
  }

  async function uploadCustom(
    field: "outgoing_ring_url" | "incoming_ring_url" | "connect_url" | "disconnect_url",
    file: File,
  ) {
    if (!file.type.startsWith("audio/")) { toast.error("Please choose an audio file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Audio must be 2 MB or smaller"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const path = `${field}.${ext}`;
    const { error } = await supabase.storage.from("call-sounds")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    await update({ data: { [field]: path } });
    toast.success("Sound uploaded");
    refreshAppSettings();
  }

  async function clearCustom(
    field: "outgoing_ring_url" | "incoming_ring_url" | "connect_url" | "disconnect_url",
  ) {
    await update({ data: { [field]: null } });
    toast.success("Reset to default");
    refreshAppSettings();
  }

  const rows: { key: keyof typeof s; title: string; desc: string; danger?: boolean }[] = [
    { key: "maintenance_mode", title: "Maintenance mode", danger: true,
      desc: "Non-admin users will see a maintenance page until you turn this off." },
    { key: "signups_enabled", title: "New signups", desc: "Allow new users to create accounts." },
    { key: "calls_enabled", title: "Audio & video calls", desc: "Allow members to start audio/video calls." },
    { key: "payments_enabled", title: "Payments", desc: "Show premium upgrade UI and accept payments." },
    { key: "membership_enabled", title: "Membership feature", desc: "Show the Membership page and premium tier UI to users." },
  ];

  const [limitFree, setLimitFree] = useState<number | null>(null);
  const [limitPremium, setLimitPremium] = useState<number | null>(null);
  async function saveLimits() {
    setSaving(true);
    try {
      await update({ data: {
        daily_message_limit_free: limitFree ?? s.daily_message_limit_free,
        daily_message_limit_premium: limitPremium ?? s.daily_message_limit_premium,
      } });
      toast.success("Limits saved");
      refreshAppSettings();
      setLimitFree(null); setLimitPremium(null);
    } catch (e) { toast.error((e as Error).message); }
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      {s.maintenance_mode && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium">Maintenance mode is ON.</p>
            <p className="text-muted-foreground">Regular users currently cannot use the app.</p>
          </div>
        </div>
      )}

      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <div key={r.key} className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className={`font-display text-lg ${r.danger ? "text-destructive" : ""}`}>{r.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </div>
            <Switch checked={Boolean(s[r.key])}
              onCheckedChange={(v) => toggle(r.key, v)} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-display text-lg">Maintenance message</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown to users when maintenance mode is ON.
        </p>
        <Textarea className="mt-3" rows={3}
          value={msg ?? s.maintenance_message}
          onChange={(e) => setMsg(e.target.value)} maxLength={500} />
        <Button className="mt-3 rounded-full" onClick={saveMessage}
          disabled={saving || msg === null || msg === s.maintenance_message}>
          {saving ? "Saving…" : "Save message"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div>
          <p className="font-display text-lg">Daily message limits</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Per user, per day. Set 0 for no messages. Per-user override is available on the Users page.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Free users</span>
            <Input type="number" min={0} className="mt-1"
              value={limitFree ?? s.daily_message_limit_free}
              onChange={(e) => setLimitFree(parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Premium users</span>
            <Input type="number" min={0} className="mt-1"
              value={limitPremium ?? s.daily_message_limit_premium}
              onChange={(e) => setLimitPremium(parseInt(e.target.value || "0", 10))} />
          </label>
        </div>
        <Button className="rounded-full" onClick={saveLimits}
          disabled={saving || (limitFree === null && limitPremium === null)}>
          {saving ? "Saving…" : "Save limits"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="font-display text-lg">Call sounds</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the ringing sound (incoming call) and the connect sound (when a call is answered).
          </p>
        </div>

        <SoundPicker
          label="Ringing sound"
          value={s.ring_sound}
          options={[
            { value: "classic", label: "Classic" },
            { value: "bell", label: "Bell" },
            { value: "chime", label: "Chime" },
            { value: "soft", label: "Soft" },
          ]}
          onChange={(v) => saveSound("ring_sound", v)}
          onPreview={(v) => { setRingVariant(v as "classic" | "bell" | "chime" | "soft"); playIncomingRing(); }}
        />

        <SoundPicker
          label="Connect sound"
          value={s.connect_sound}
          options={[
            { value: "beep", label: "Beep" },
            { value: "ding", label: "Ding" },
            { value: "chord", label: "Chord" },
            { value: "pop", label: "Pop" },
          ]}
          onChange={(v) => saveSound("connect_sound", v)}
          onPreview={(v) => { setConnectVariant(v as "beep" | "ding" | "chord" | "pop"); playCallConnected(); }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="font-display text-lg">Custom call audio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your own audio file (MP3/WAV, max 2 MB). Leave blank to use the default tone.
          </p>
        </div>
        <CustomSoundRow
          label="Outgoing ring (heard by the caller)"
          url={s.outgoing_ring_url}
          onUpload={(f) => uploadCustom("outgoing_ring_url", f)}
          onClear={() => clearCustom("outgoing_ring_url")}
          onPreview={(u) => playUrl(u)}
        />
        <CustomSoundRow
          label="Incoming ring (heard by the receiver)"
          url={s.incoming_ring_url}
          onUpload={(f) => uploadCustom("incoming_ring_url", f)}
          onClear={() => clearCustom("incoming_ring_url")}
          onPreview={(u) => playUrl(u)}
        />
        <CustomSoundRow
          label="Call connect sound"
          url={s.connect_url}
          onUpload={(f) => uploadCustom("connect_url", f)}
          onClear={() => clearCustom("connect_url")}
          onPreview={(u) => playUrl(u)}
          fallbackPreview={() => playCallConnected()}
        />
        <CustomSoundRow
          label="Call disconnect sound"
          url={s.disconnect_url}
          onUpload={(f) => uploadCustom("disconnect_url", f)}
          onClear={() => clearCustom("disconnect_url")}
          onPreview={(u) => playUrl(u)}
          fallbackPreview={() => playCallDisconnected()}
        />
      </div>
    </section>
  );
}

function playUrl(url: string) {
  try { const a = new Audio(url); a.volume = 0.9; a.play().catch(() => {}); } catch { /* noop */ }
}

function CustomSoundRow({ label, url, onUpload, onClear, onPreview, fallbackPreview }: {
  label: string;
  url: string | null;
  onUpload: (f: File) => void;
  onClear: () => void;
  onPreview: (u: string) => void;
  fallbackPreview?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {url ? "Custom audio is set" : "Default tone is in use"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Preview"
          onClick={() => (url ? onPreview(url) : fallbackPreview?.())}
          className="rounded-full p-2 hover:bg-accent">
          <Play className="h-4 w-4" />
        </button>
        <input ref={inputRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            if (inputRef.current) inputRef.current.value = "";
          }} />
        <Button size="sm" variant="outline" className="rounded-full"
          onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" /> Upload
        </Button>
        {url && (
          <Button size="sm" variant="ghost" className="rounded-full text-destructive"
            onClick={onClear} aria-label="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SoundPicker({ label, value, options, onChange, onPreview }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onPreview: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => (
          <div key={o.value} className={`flex items-center justify-between gap-2 rounded-xl border p-2 ${value === o.value ? "border-primary bg-primary/5" : "border-border"}`}>
            <button type="button" className="flex-1 text-left text-sm"
              onClick={() => onChange(o.value)}>
              {o.label}
            </button>
            <button type="button" aria-label={`Preview ${o.label}`}
              onClick={() => onPreview(o.value)}
              className="rounded-full p-1.5 hover:bg-accent">
              <Play className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}