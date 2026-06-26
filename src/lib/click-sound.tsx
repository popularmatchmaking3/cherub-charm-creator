import { useEffect } from "react";

let ctx: AudioContext | null = null;

type SoundVariant = "tap" | "nav" | "send" | "success" | "danger" | "call" | "toggle";

let activeRingTimer: number | null = null;
let activeRingAudio: HTMLAudioElement | null = null;

type CustomSoundKey = "outgoingRing" | "incomingRing" | "connect" | "disconnect";
const customUrls: Record<CustomSoundKey, string | null> = {
  outgoingRing: null, incomingRing: null, connect: null, disconnect: null,
};
export function setCustomSound(key: CustomSoundKey, url: string | null) {
  customUrls[key] = url && url.length > 0 ? url : null;
}
function playCustomLoop(url: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  try {
    const a = new Audio(url);
    a.loop = true;
    a.volume = 0.9;
    a.play().catch(() => {});
    return a;
  } catch { return null; }
}
function playCustomOnce(url: string) {
  if (typeof window === "undefined") return;
  try { const a = new Audio(url); a.volume = 0.9; a.play().catch(() => {}); } catch { /* noop */ }
}

type RingVariant = "classic" | "bell" | "chime" | "soft";
type ConnectVariant = "beep" | "ding" | "chord" | "pop";
let ringVariant: RingVariant = "classic";
let connectVariant: ConnectVariant = "beep";
export function setRingVariant(v: RingVariant) { ringVariant = v; }
export function setConnectVariant(v: ConnectVariant) { connectVariant = v; }

type NotifVariant = "pop" | "ding" | "chime" | "soft";
let notifVariant: NotifVariant = "pop";
export function setNotifVariant(v: NotifVariant) { notifVariant = v; }

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = (window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function tone(audio: AudioContext, frequency: number, start: number, duration: number, gainNode: GainNode) {
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  osc.connect(gainNode);
  osc.start(start);
  osc.stop(start + duration);
}

export function playClick(variant: SoundVariant = "tap") {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(120, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(filter).connect(audio.destination);

    const notes: Record<SoundVariant, number[]> = {
      tap: [880, 1320],
      nav: [523, 784],
      send: [659, 988, 1319],
      success: [587, 880, 1175],
      danger: [392, 294],
      call: [440, 660, 880],
      toggle: [740, 554],
    };
    notes[variant].forEach((f, i) => tone(audio, f, now + i * 0.045, 0.09, gain));
  } catch { /* noop */ }
}

export function playCallConnected() {
  if (customUrls.connect) { playCustomOnce(customUrls.connect); return; }
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gain.connect(audio.destination);
    const presets: Record<ConnectVariant, number[]> = {
      beep: [1047, 1568],
      ding: [1760],
      chord: [659, 988, 1319],
      pop: [440, 880],
    };
    presets[connectVariant].forEach((f, i) => tone(audio, f, now + i * 0.075, 0.12, gain));
  } catch { /* noop */ }
}

export function playIncomingRing() {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    gain.connect(filter).connect(audio.destination);
    const presets: Record<RingVariant, number[]> = {
      classic: [659, 880, 1175, 880],
      bell: [988, 1319, 988, 1319],
      chime: [523, 659, 784, 1047],
      soft: [440, 554, 440, 554],
    };
    presets[ringVariant].forEach((f, i) => tone(audio, f, now + i * 0.16, 0.18, gain));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([120, 80, 120]);
  } catch { /* noop */ }
}

export function startIncomingRing() {
  if (typeof window === "undefined") return () => {};
  stopIncomingRing();
  if (customUrls.incomingRing) {
    activeRingAudio = playCustomLoop(customUrls.incomingRing);
  } else {
    playIncomingRing();
    activeRingTimer = window.setInterval(playIncomingRing, 1800);
  }
  return stopIncomingRing;
}

export function startOutgoingRing() {
  if (typeof window === "undefined") return () => {};
  stopIncomingRing();
  if (customUrls.outgoingRing) {
    activeRingAudio = playCustomLoop(customUrls.outgoingRing);
  } else {
    // fallback: synthesized incoming-ring tones (still acceptable)
    playIncomingRing();
    activeRingTimer = window.setInterval(playIncomingRing, 1800);
  }
  return stopIncomingRing;
}

export function stopIncomingRing() {
  if (activeRingTimer) { window.clearInterval(activeRingTimer); activeRingTimer = null; }
  if (activeRingAudio) {
    try { activeRingAudio.pause(); activeRingAudio.currentTime = 0; } catch { /* noop */ }
    activeRingAudio = null;
  }
}

export function playCallDisconnected() {
  if (customUrls.disconnect) { playCustomOnce(customUrls.disconnect); return; }
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    gain.connect(audio.destination);
    [523, 392].forEach((f, i) => tone(audio, f, now + i * 0.13, 0.18, gain));
  } catch { /* noop */ }
}

export function playMessageSent() {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gain.connect(filter).connect(audio.destination);
    // pleasant rising "whoosh" — premium feel
    [784, 1175, 1568].forEach((f, i) => tone(audio, f, now + i * 0.05, 0.11, gain));
  } catch { /* noop */ }
}

export function playMessageReceived() {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    gain.connect(audio.destination);
    // soft two-tone ping
    [1318, 988].forEach((f, i) => tone(audio, f, now + i * 0.09, 0.18, gain));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(60);
  } catch { /* noop */ }
}

export function playNotification() {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    gain.connect(audio.destination);
    const presets: Record<NotifVariant, number[]> = {
      pop: [988, 1319],
      ding: [1568, 2093],
      chime: [784, 988, 1319],
      soft: [523, 659],
    };
    presets[notifVariant].forEach((f, i) => tone(audio, f, now + i * 0.07, 0.12, gain));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(80);
  } catch { /* noop */ }
}

function inferVariant(el: HTMLElement): SoundVariant {
  const explicit = el.dataset.sound as SoundVariant | undefined;
  if (explicit) return explicit;
  const text = (el.textContent ?? "").toLowerCase();
  const label = `${text} ${(el.getAttribute("aria-label") ?? "").toLowerCase()} ${(el.getAttribute("title") ?? "").toLowerCase()}`;
  const role = el.getAttribute("role");
  if (el.getAttribute("type") === "submit" || /send|message|interest|impress/.test(label)) return "send";
  if (/accept|approve|save|claim|verify|updated|continue/.test(label)) return "success";
  if (/decline|reject|delete|remove|cancel|sign out|end|hang|off/.test(label)) return "danger";
  if (/call|phone|video|audio|mic|camera/.test(label)) return "call";
  if (role === "switch" || el.getAttribute("aria-checked") !== null) return "toggle";
  if (el.tagName === "A") return "nav";
  return "tap";
}

export function useGlobalClickSound() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const el = t.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"]',
      ) as HTMLElement | null;
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      if (el.dataset.silent === "true") return;
      playClick(inferVariant(el));
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);
}