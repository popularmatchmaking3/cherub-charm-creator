import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewState {
  loading: boolean;
  status: ReviewStatus | null;
  notes: string | null;
  isProfileComplete: boolean;
  refetch: () => void;
}

export function useReviewStatus(): ReviewState {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<ReviewState, "refetch">>({
    loading: true,
    status: null,
    notes: null,
    isProfileComplete: false,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!user) {
      setState({ loading: false, status: null, notes: null, isProfileComplete: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    supabase
      .from("profiles")
      .select("review_status,review_notes,is_profile_complete")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setState({
          loading: false,
          status: ((data as { review_status?: ReviewStatus | null } | null)?.review_status ?? null),
          notes: ((data as { review_notes?: string | null } | null)?.review_notes ?? null),
          isProfileComplete: !!(data as { is_profile_complete?: boolean } | null)?.is_profile_complete,
        });
      });

    // realtime: react when admin approves / rejects
    const ch = supabase
      .channel(`review-status:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { review_status?: ReviewStatus; review_notes?: string | null; is_profile_complete?: boolean };
          setState((prev) => ({
            loading: false,
            status: row.review_status ?? prev.status,
            notes: row.review_notes ?? prev.notes,
            isProfileComplete: row.is_profile_complete ?? prev.isProfileComplete,
          }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, nonce]);

  return { ...state, refetch: () => setNonce((n) => n + 1) };
}