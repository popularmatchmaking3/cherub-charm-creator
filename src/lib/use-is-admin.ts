import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);
  return isAdmin;
}

export type AdminPerm = "settings" | "users" | "requests" | "verify" | "notifications" | "admins" | "stories";

export const ADMIN_PERMS: { key: AdminPerm; label: string; description: string }[] = [
  { key: "settings", label: "App Settings", description: "Maintenance mode, payments, calls toggles" },
  { key: "users", label: "Users", description: "Verify, hide, change membership of members" },
  { key: "requests", label: "Membership Requests", description: "Approve / reject premium upgrade requests" },
  { key: "verify", label: "Verifications", description: "Profile verification queue" },
  { key: "notifications", label: "Notifications", description: "Send broadcasts and targeted notifications" },
  { key: "admins", label: "Manage Admins", description: "Grant or revoke admin access" },
  { key: "stories", label: "Success Stories", description: "Publish and manage couple success stories" },
];

export interface AdminPermsState {
  isAdmin: boolean;
  fullAccess: boolean;
  permissions: AdminPerm[];
  loading: boolean;
  can: (p: AdminPerm) => boolean;
}

export function useAdminPerms(): AdminPermsState {
  const { user } = useAuth();
  const [state, setState] = useState<{ isAdmin: boolean; full: boolean; perms: AdminPerm[]; loading: boolean }>({
    isAdmin: false, full: false, perms: [], loading: true,
  });
  useEffect(() => {
    if (!user) { setState({ isAdmin: false, full: false, perms: [], loading: false }); return; }
    supabase.from("user_roles")
      .select("role, permissions")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => {
        if (!data) { setState({ isAdmin: false, full: false, perms: [], loading: false }); return; }
        const raw = (data as { permissions: string[] | null }).permissions;
        const full = !raw || raw.length === 0;
        setState({ isAdmin: true, full, perms: (raw ?? []) as AdminPerm[], loading: false });
      });
  }, [user]);
  return {
    isAdmin: state.isAdmin,
    fullAccess: state.full,
    permissions: state.perms,
    loading: state.loading,
    can: (p) => state.isAdmin && (state.full || state.perms.includes(p)),
  };
}

export function pairKey(a: string, b: string): { user1_id: string; user2_id: string } {
  return a < b ? { user1_id: a, user2_id: b } : { user1_id: b, user2_id: a };
}