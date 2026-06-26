import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles")
    .select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admins only");
}

async function assertAdminPerm(userId: string, perm: string) {
  const { data } = await supabaseAdmin.from("user_roles")
    .select("role, permissions").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admins only");
  const perms = (data as { permissions: string[] | null }).permissions;
  const full = !perms || perms.length === 0;
  if (!full && !perms.includes(perm)) {
    throw new Error("You don't have permission for this action.");
  }
}

const ADMIN_PERM_KEYS = ["settings", "users", "requests", "verify", "notifications", "admins"] as const;

export const getAdminPresence = createServerFn({ method: "GET" })
  .handler(async () => {
    const { count } = await supabaseAdmin.from("user_roles")
      .select("*", { count: "exact", head: true }).eq("role", "admin");
    return { hasAdmin: (count ?? 0) > 0 };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      return { ok: false, reason: "An admin already exists." };
    }
    const { error } = await supabaseAdmin.from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(1000),
    audience: z.enum(["all", "user"]),
    target_user_id: z.string().uuid().optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.audience === "user" && !data.target_user_id) {
      throw new Error("Target user required");
    }
    const { error } = await supabaseAdmin.from("notifications").insert({
      title: data.title,
      body: data.body,
      audience: data.audience,
      target_user_id: data.audience === "user" ? data.target_user_id : null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    maintenance_mode: z.boolean().optional(),
    calls_enabled: z.boolean().optional(),
    payments_enabled: z.boolean().optional(),
    signups_enabled: z.boolean().optional(),
    membership_enabled: z.boolean().optional(),
    maintenance_message: z.string().max(500).optional(),
    ring_sound: z.enum(["classic", "bell", "chime", "soft"]).optional(),
    connect_sound: z.enum(["beep", "ding", "chord", "pop"]).optional(),
    outgoing_ring_url: z.string().nullable().optional(),
    incoming_ring_url: z.string().nullable().optional(),
    connect_url: z.string().nullable().optional(),
    disconnect_url: z.string().nullable().optional(),
    daily_message_limit_free: z.number().int().min(0).max(10000).optional(),
    daily_message_limit_premium: z.number().int().min(0).max(100000).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("app_settings")
      .update({ ...data, updated_by: context.userId, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    tier: z.enum(["free", "premium"]),
    days: z.number().min(0).max(3650).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const expires = data.tier === "premium" && data.days
      ? new Date(Date.now() + data.days * 86400000).toISOString()
      : null;
    const { error } = await supabaseAdmin.from("profiles")
      .update({ membership_tier: data.tier, membership_expires_at: expires })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetMessageLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    limit: z.number().int().min(0).max(100000).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("profiles")
      .update({ daily_message_limit_override: data.limit })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    hidden: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("profiles")
      .update({ is_hidden: data.hidden }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    verified: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("profiles")
      .update({ is_verified: data.verified }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    kind: z.enum(["id", "disability"]),
    action: z.enum(["approve", "reject"]),
    note: z.string().max(500).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminPerm(context.userId, "verify");
    const status = data.action === "approve" ? "verified" : "rejected";
    const { error } = data.kind === "id"
      ? await supabaseAdmin.from("profiles").update({
          id_verification_status: status,
          id_verification_note: data.note ?? null,
          ...(data.action === "approve" ? { is_verified: true } : {}),
        }).eq("id", data.user_id)
      : await supabaseAdmin.from("profiles").update({
          disability_verification_status: status,
          disability_verification_note: data.note ?? null,
          disability_verified: data.action === "approve",
        }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetVerificationDocUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    path: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminPerm(context.userId, "verify");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("verification-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });

export const adminToggleProtection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    block_disabled: z.boolean().optional(),
    report_disabled: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: { block_disabled?: boolean; report_disabled?: boolean } = {};
    if (typeof data.block_disabled === "boolean") patch.block_disabled = data.block_disabled;
    if (typeof data.report_disabled === "boolean") patch.report_disabled = data.report_disabled;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("profiles")
      .update(patch).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    make_admin: z.boolean(),
    full_access: z.boolean().optional(),
    permissions: z.array(z.enum(ADMIN_PERM_KEYS)).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminPerm(context.userId, "admins");
    if (data.make_admin) {
      const perms = data.full_access ? null : (data.permissions ?? []);
      const { data: existing } = await supabaseAdmin.from("user_roles")
        .select("id").eq("user_id", data.user_id).eq("role", "admin").maybeSingle();
      if (existing) {
        const { error } = await supabaseAdmin.from("user_roles")
          .update({ permissions: perms }).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.from("user_roles")
          .insert({ user_id: data.user_id, role: "admin", permissions: perms });
        if (error) throw new Error(error.message);
      }
    } else {
      if (data.user_id === context.userId) throw new Error("You cannot remove your own admin role.");
      const { error } = await supabaseAdmin.from("user_roles")
        .delete().eq("user_id", data.user_id).eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminUpdatePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    full_access: z.boolean(),
    permissions: z.array(z.enum(ADMIN_PERM_KEYS)).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminPerm(context.userId, "admins");
    const perms = data.full_access ? null : (data.permissions ?? []);
    const { error } = await supabaseAdmin.from("user_roles")
      .update({ permissions: perms })
      .eq("user_id", data.user_id).eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReviewMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    request_id: z.string().uuid(),
    action: z.enum(["approve", "reject"]),
    days: z.number().min(1).max(3650).default(30),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: req, error: reqErr } = await supabaseAdmin.from("membership_requests")
      .select("user_id, requested_tier").eq("id", data.request_id).maybeSingle();
    if (reqErr || !req) throw new Error(reqErr?.message ?? "Request not found");

    const newStatus = data.action === "approve" ? "approved" : "rejected";
    const { error: upErr } = await supabaseAdmin.from("membership_requests")
      .update({ status: newStatus, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.request_id);
    if (upErr) throw new Error(upErr.message);

    if (data.action === "approve") {
      const expires = new Date(Date.now() + data.days * 86400000).toISOString();
      const { error: pErr } = await supabaseAdmin.from("profiles")
        .update({ membership_tier: req.requested_tier, membership_expires_at: expires })
        .eq("id", req.user_id);
      if (pErr) throw new Error(pErr.message);
    }
    return { ok: true };
  });