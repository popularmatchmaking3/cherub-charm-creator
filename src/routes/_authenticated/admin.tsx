import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAdminPerms, type AdminPerm } from "@/lib/use-is-admin";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, Settings, Users, Inbox, BadgeCheck, Bell, ShieldCheck, LifeBuoy, Heart, ClipboardCheck, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — United Disabled Matrimony" }] }),
  component: AdminLayout,
});

const TABS: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; perm?: AdminPerm }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/settings", label: "App Settings", icon: Settings, perm: "settings" },
  { to: "/admin/users", label: "Users", icon: Users, perm: "users" },
  { to: "/admin/reviews", label: "Account Reviews", icon: ClipboardCheck, perm: "users" },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck, perm: "admins" },
  { to: "/admin/requests", label: "Membership", icon: Inbox, perm: "requests" },
  { to: "/admin/verify", label: "Verifications", icon: BadgeCheck, perm: "verify" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell, perm: "notifications" },
  { to: "/admin/stories", label: "Success Stories", icon: Heart, perm: "stories" },
  { to: "/admin/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/admin/tickets", label: "Support", icon: LifeBuoy },
];

function AdminLayout() {
  const { isAdmin, loading, can } = useAdminPerms();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return <main className="px-6 py-16 text-center text-muted-foreground">Loading…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl">Admins only</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
        <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
          Back to Browse
        </Button>
      </main>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.perm || can(t.perm));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Admin Console</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Control Panel</h1>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {visibleTabs.map((t) => {
          const active = t.exact
            ? location.pathname === t.to
            : location.pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to as "/admin"}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm transition ${
                active
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </main>
  );
}