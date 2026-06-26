import { supabase } from "@/integrations/supabase/client";
import { notifyUserEvent } from "@/lib/notify.functions";

export type ConnectionState = "none" | "sent" | "received" | "matched";

export interface ConnectionStatus {
  state: ConnectionState;
  incomingId: string | null;
}

function pairKey(a: string, b: string): { user1_id: string; user2_id: string } {
  return a < b ? { user1_id: a, user2_id: b } : { user1_id: b, user2_id: a };
}

export async function getConnectionState(
  currentUserId: string,
  otherUserId: string,
): Promise<ConnectionStatus> {
  const { data, error } = await supabase
    .from("interests")
    .select("id, sender_id, receiver_id, status")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`,
    );

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: "pending" | "accepted" | "declined";
  }[];
  if (rows.some((r) => r.status === "accepted"))
    return { state: "matched" as const, incomingId: null };
  const incoming = rows.find((r) => r.status === "pending" && r.receiver_id === currentUserId);
  if (incoming) return { state: "received" as const, incomingId: incoming.id };
  if (rows.some((r) => r.status === "pending" && r.sender_id === currentUserId)) {
    return { state: "sent" as const, incomingId: null };
  }
  return { state: "none" as const, incomingId: null };
}

export async function ensureConversation(currentUserId: string, otherUserId: string) {
  const keys = pairKey(currentUserId, otherUserId);
  const { data: existing, error: selectError } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", keys.user1_id)
    .eq("user2_id", keys.user2_id)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (existing?.id) return existing.id;

  const { data, error } = await supabase.from("conversations").insert(keys).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function acceptInterestAndEnsureConversation(
  interestId: string,
  currentUserId: string,
  otherUserId: string,
) {
  const { error } = await supabase
    .from("interests")
    .update({ status: "accepted" })
    .eq("id", interestId);
  if (error) throw new Error(error.message);
  const convId = await ensureConversation(currentUserId, otherUserId);
  try {
    await notifyUserEvent({ data: { kind: "interest_accepted", target_user_id: otherUserId } });
  } catch { /* notification is best-effort */ }
  return convId;
}

export async function sendInterest(currentUserId: string, otherUserId: string) {
  const existing = await getConnectionState(currentUserId, otherUserId);
  if (existing.state === "sent") return existing;
  if (existing.state === "received") return existing;
  if (existing.state === "matched") return existing;

  const { error } = await supabase
    .from("interests")
    .insert({ sender_id: currentUserId, receiver_id: otherUserId });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("duplicate key") || (error as { code?: string }).code === "23505") {
      throw new Error("You have already sent an interest to this member.");
    }
    if (msg.includes("interests_check")) {
      throw new Error("You cannot send an interest to yourself.");
    }
    if (msg.toLowerCase().includes("row-level security")) {
      throw new Error("You must be signed in to send an interest.");
    }
    throw new Error(msg || "Could not send interest. Please try again shortly.");
  }
  try {
    await notifyUserEvent({ data: { kind: "interest_received", target_user_id: otherUserId } });
  } catch { /* notification is best-effort */ }
  return { state: "sent" as const, incomingId: null };
}

export async function withdrawInterest(currentUserId: string, otherUserId: string) {
  const { error } = await supabase
    .from("interests")
    .delete()
    .eq("sender_id", currentUserId)
    .eq("receiver_id", otherUserId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return { state: "none" as const, incomingId: null };
}

export async function startMatchedCall(
  currentUserId: string,
  otherUserId: string,
  type: "audio" | "video",
) {
  const { data: callee } = await supabase
    .from("profiles")
    .select("accept_audio_calls,accept_video_calls,full_name")
    .eq("id", otherUserId)
    .maybeSingle();
  if (callee) {
    if (type === "audio" && callee.accept_audio_calls === false) {
      throw new Error(`${callee.full_name ?? "Yeh user"} ne audio calls band ki hui hain.`);
    }
    if (type === "video" && callee.accept_video_calls === false) {
      throw new Error(`${callee.full_name ?? "Yeh user"} ne video calls band ki hui hain.`);
    }
  }
  const { data, error } = await supabase
    .from("calls")
    .insert({ caller_id: currentUserId, callee_id: otherUserId, type })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not start call");
  return data.id;
}
