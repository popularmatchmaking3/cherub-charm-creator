import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const TICKET_CATEGORIES = [
  { value: "account", label: "Account & Login" },
  { value: "billing", label: "Membership / Billing" },
  { value: "profile", label: "Profile / Photos" },
  { value: "matching", label: "Interests & Matches" },
  { value: "calls", label: "Calls / Messages" },
  { value: "verification", label: "Verification" },
  { value: "abuse", label: "Abuse / Safety" },
  { value: "bug", label: "Bug Report" },
  { value: "general", label: "Other" },
] as const;

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      subject: z.string().trim().min(3).max(140),
      category: z.string().max(30).default("general"),
      message: z.string().trim().min(5).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: t, error } = await context.supabase
      .from("support_tickets")
      .insert({
        user_id: context.userId,
        subject: data.subject,
        category: data.category,
        status: "open",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: mErr } = await context.supabase
      .from("ticket_messages")
      .insert({
        ticket_id: t.id,
        sender_id: context.userId,
        message: data.message,
        is_admin_reply: false,
      });
    if (mErr) throw new Error(mErr.message);
    return { id: t.id };
  });

export const listMyTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, subject, category, status, priority, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: t, error } = await context.supabase
      .from("support_tickets")
      .select("id, user_id, subject, category, status, priority, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!t) throw new Error("Ticket not found.");
    const { data: msgs, error: mErr } = await context.supabase
      .from("ticket_messages")
      .select("id, sender_id, message, is_admin_reply, created_at")
      .eq("ticket_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);
    return { ticket: t, messages: msgs ?? [] };
  });

export const postTicketMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      ticket_id: z.string().uuid(),
      message: z.string().trim().min(1).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await isAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("ticket_messages").insert({
      ticket_id: data.ticket_id,
      sender_id: context.userId,
      message: data.message,
      is_admin_reply: admin,
    });
    if (error) throw new Error(error.message);
    // bump updated_at + reopen if user replies on resolved
    await context.supabase.from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.ticket_id);
    return { ok: true };
  });

export const listAllTicketsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: z.enum(["open", "in_progress", "resolved", "closed", "all"]).default("all") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    let q = context.supabase
      .from("support_tickets")
      .select("id, user_id, subject, category, status, priority, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: tickets, error } = await q;
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((tickets ?? []).map((t) => t.user_id)));
    const { data: profs } = userIds.length
      ? await context.supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
    const byId = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    return (tickets ?? []).map((t) => ({ ...t, user_name: byId.get(t.user_id) ?? null }));
  });

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { error } = await context.supabase.from("support_tickets")
      .update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });