import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Mail, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/suggestions")({
  component: AdminSuggestions,
});

interface Suggestion {
  id: string;
  name: string;
  email: string | null;
  message: string;
  created_at: string;
  user_id: string | null;
}

function AdminSuggestions() {
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("feature_suggestions" as never)
      .select("id, name, email, message, created_at, user_id")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as unknown as Suggestion[]);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    const { error } = await supabase.from("feature_suggestions" as never).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Feature Suggestions</h2>
        <p className="text-sm text-muted-foreground">User-submitted ideas and feature requests.</p>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No suggestions yet.
        </p>
      )}
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-muted-foreground" /> {s.name}
                </p>
                {s.email && (
                  <a href={`mailto:${s.email}`} className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {s.email}
                  </a>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-destructive"
                onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{s.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}