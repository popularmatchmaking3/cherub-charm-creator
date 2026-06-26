import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BadgeCheck, Inbox, Phone, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, pendingVerify: 0, pendingRequests: 0, activeCalls: 0, openTickets: 0 });

  useEffect(() => {
    (async () => {
      const [u, v, r, c, t] = await Promise.all([
        supabase.from("profiles").select("id", { head: true, count: "exact" }),
        supabase.from("profiles").select("id", { head: true, count: "exact" })
          .eq("is_verified", false).eq("is_profile_complete", true),
        supabase.from("membership_requests").select("id", { head: true, count: "exact" }).eq("status", "pending"),
        supabase.from("calls").select("id", { head: true, count: "exact" }).in("status", ["ringing", "accepted"]),
        supabase.from("support_tickets").select("id", { head: true, count: "exact" }).in("status", ["open", "in_progress"]),
      ]);
      setStats({
        users: u.count ?? 0,
        pendingVerify: v.count ?? 0,
        pendingRequests: r.count ?? 0,
        activeCalls: c.count ?? 0,
        openTickets: t.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Total users", value: stats.users, icon: Users },
    { label: "Pending verifications", value: stats.pendingVerify, icon: BadgeCheck },
    { label: "Premium requests", value: stats.pendingRequests, icon: Inbox },
    { label: "Active calls", value: stats.activeCalls, icon: Phone },
    { label: "Open tickets", value: stats.openTickets, icon: LifeBuoy },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-3xl">{c.value}</p>
          </div>
        );
      })}
    </section>
  );
}