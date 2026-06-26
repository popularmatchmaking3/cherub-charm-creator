import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getClientIp(req: Request | undefined): string | null {
  if (!req?.headers) return null;
  const h = req.headers;
  const candidates = [
    h.get("cf-connecting-ip"),
    h.get("x-real-ip"),
    h.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ].filter(Boolean) as string[];
  return candidates[0] ?? null;
}

function deviceLabelFromUA(ua: string | null): string {
  if (!ua) return "Unknown device";
  let os = "Unknown OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return `${browser} on ${os}`;
}

export const recordLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const req = getRequest();
    const ip = getClientIp(req);
    const ua = req?.headers?.get("user-agent") ?? null;
    const device_label = deviceLabelFromUA(ua);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Detect suspicious: never-seen IP for this user in last 30 days
    let isSuspicious = false;
    let reason: string | null = null;
    if (ip) {
      const { data: priorIp } = await supabaseAdmin
        .from("login_history")
        .select("id")
        .eq("user_id", userId)
        .eq("ip", ip)
        .limit(1)
        .maybeSingle();
      if (!priorIp) {
        const { count } = await supabaseAdmin
          .from("login_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if ((count ?? 0) > 0) {
          isSuspicious = true;
          reason = "Naye IP/location se login";
        }
      }
    }

    await supabaseAdmin.from("login_history").insert({
      user_id: userId,
      ip,
      user_agent: ua,
      device_label,
      is_suspicious: isSuspicious,
      suspicious_reason: reason,
    });

    return { ok: true, suspicious: isSuspicious };
  });

export const getLoginHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("login_history")
      .select("id, ip, user_agent, device_label, country, city, is_suspicious, suspicious_reason, is_trusted, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const logoutAllDevices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      await supabaseAdmin.auth.admin.signOut(context.userId, "global");
    } catch (e) {
      throw new Error((e as Error).message);
    }
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Profile + related rows cascade via FK
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });