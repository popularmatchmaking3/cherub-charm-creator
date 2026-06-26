import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { adminSendNotification } from "@/lib/admin.functions";
import { Bell, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsAdmin,
});

interface Row { id: string; title: string; body: string; audience: string; target_user_id: string | null; created_at: string; }

function NotificationsAdmin() {
  const send = useServerFn(adminSendNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [target, setTarget] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("notifications")
      .select("id,title,body,audience,target_user_id,created_at")
      .order("created_at", { ascending: false }).limit(50);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ data: { title, body, audience, target_user_id: audience === "user" ? target : null } });
      toast.success("Notification sent");
      setTitle(""); setBody(""); setTarget("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl">Send notification</h2>
        </div>
        <div className="flex gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={audience === "all"} onChange={() => setAudience("all")} />
            All users
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={audience === "user"} onChange={() => setAudience("user")} />
            Specific user
          </label>
        </div>
        {audience === "user" && (
          <Input placeholder="Target user ID (uuid)" value={target} onChange={(e) => setTarget(e.target.value)} required />
        )}
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <Textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={1000} rows={4} />
        <Button type="submit" disabled={busy} className="rounded-full">
          {busy ? "Sending..." : "Send"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Recent</h2>
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {r.audience === "all" ? "All users" : `User: ${r.target_user_id?.slice(0, 8)}…`} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
        </ul>
      </div>
    </section>
  );
}