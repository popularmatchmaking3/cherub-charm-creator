import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Kind = "interest_received" | "interest_accepted";

const TEMPLATES: Record<Kind, { title: string; body: (name: string) => string }> = {
  interest_received: {
    title: "New interest received",
    body: (n) => `${n} sent you an interest.`,
  },
  interest_accepted: {
    title: "It's a match!",
    body: (n) => `${n} accepted your interest. You can message them now.`,
  },
};

export const notifyUserEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      kind: z.enum(["interest_received", "interest_accepted"]),
      target_user_id: z.string().uuid(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sender } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    const name = sender?.full_name?.trim() || "A member";
    const tpl = TEMPLATES[data.kind as Kind];
    const { error } = await supabaseAdmin.from("notifications").insert({
      title: tpl.title,
      body: tpl.body(name),
      audience: "user",
      target_user_id: data.target_user_id,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });