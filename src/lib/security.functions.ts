import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles")
    .select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admins only");
}

// Called on every authenticated mount. Returns ban state; also logs IP and
// rejects when IP is banned.
export const checkAndLogSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const req = getRequest();
    const ip = getClientIp(req);
    const ua = req?.headers?.get("user-agent") ?? null;

    // 1) Banned IP check
    if (ip) {
      const { data: blockedIp } = await supabaseAdmin
        .from("banned_ips").select("ip").eq("ip", ip).maybeSingle();
      if (blockedIp) {
        return { banned: true, permanent: true, reason: "Yeh device permanently banned hai." };
      }
      // log
      await supabaseAdmin.from("user_ip_log")
        .upsert({ user_id: userId, ip, user_agent: ua }, { onConflict: "user_id,ip" });
    }

    // 2) Account ban check
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("is_banned_permanent, banned_until, ban_reason").eq("id", userId).maybeSingle();
    if (!profile) return { banned: false };
    if (profile.is_banned_permanent) {
      return { banned: true, permanent: true, reason: profile.ban_reason ?? "Account permanently banned." };
    }
    if (profile.banned_until && new Date(profile.banned_until).getTime() > Date.now()) {
      return {
        banned: true, permanent: false,
        reason: profile.ban_reason ?? "Account temporarily suspended.",
        until: profile.banned_until,
      };
    }
    return { banned: false };
  });

export const adminBanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    type: z.enum(["temporary", "permanent"]),
    days: z.number().min(1).max(3650).optional(),
    reason: z.string().max(500).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot ban yourself.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.type === "temporary") {
      const days = data.days ?? 7;
      const until = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await supabaseAdmin.from("profiles").update({
        banned_until: until,
        is_banned_permanent: false,
        ban_reason: data.reason ?? null,
        is_hidden: true,
      }).eq("id", data.user_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("profiles").update({
        is_banned_permanent: true,
        banned_until: null,
        ban_reason: data.reason ?? null,
        is_hidden: true,
      }).eq("id", data.user_id);
      if (error) throw new Error(error.message);

      // Collect all known IPs and block them
      const { data: ips } = await supabaseAdmin.from("user_ip_log")
        .select("ip").eq("user_id", data.user_id);
      const rows = (ips ?? []).map((r: { ip: string }) => ({
        ip: r.ip, banned_user_id: data.user_id, reason: data.reason ?? "Permanent ban",
      }));
      if (rows.length > 0) {
        await supabaseAdmin.from("banned_ips")
          .upsert(rows, { onConflict: "ip" });
      }
      // Sign the user out of all sessions
      try { await supabaseAdmin.auth.admin.signOut(data.user_id, "global"); } catch { /* noop */ }
    }
    return { ok: true };
  });

export const adminUnbanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({
      banned_until: null, is_banned_permanent: false, ban_reason: null, is_hidden: false,
    }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    // Also remove their IPs from banned_ips
    await supabaseAdmin.from("banned_ips").delete().eq("banned_user_id", data.user_id);
    return { ok: true };
  });