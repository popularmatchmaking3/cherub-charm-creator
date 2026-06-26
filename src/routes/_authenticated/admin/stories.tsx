import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Heart, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useAdminPerms } from "@/lib/use-is-admin";

export const Route = createFileRoute("/_authenticated/admin/stories")({
  head: () => ({ meta: [{ title: "Success Stories — Admin" }] }),
  component: AdminStoriesPage,
});

interface Story {
  id: string;
  couple_names: string;
  story: string;
  image_url: string | null;
  married_on: string | null;
  is_published: boolean;
  created_at: string;
}

function AdminStoriesPage() {
  const { can, loading: permsLoading } = useAdminPerms();
  const allowed = can("stories");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    couple_names: "",
    story: "",
    image_url: "",
    married_on: "",
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("success_stories" as never)
      .select("id, couple_names, story, image_url, married_on, is_published, created_at")
      .order("created_at", { ascending: false });
    setStories(((data ?? []) as unknown) as Story[]);
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  if (permsLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!allowed) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You do not have permission to manage success stories.
      </p>
    );
  }

  async function save() {
    if (!form.couple_names.trim() || !form.story.trim()) {
      toast.error("Couple names and story are required.");
      return;
    }
    setSaving(true);
    const payload = {
      couple_names: form.couple_names.trim(),
      story: form.story.trim(),
      image_url: form.image_url.trim() || null,
      married_on: form.married_on || null,
      is_published: form.is_published,
    };
    const { error } = await supabase
      .from("success_stories" as never)
      .insert(payload as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Story added.");
    setShowForm(false);
    setForm({ couple_names: "", story: "", image_url: "", married_on: "", is_published: true });
    load();
  }

  async function togglePublish(id: string, next: boolean) {
    setStories((s) => s.map((x) => (x.id === id ? { ...x, is_published: next } : x)));
    const { error } = await supabase
      .from("success_stories" as never)
      .update({ is_published: next } as never)
      .eq("id" as never, id as never);
    if (error) { toast.error(error.message); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this story permanently?")) return;
    const { error } = await supabase
      .from("success_stories" as never)
      .delete()
      .eq("id" as never, id as never);
    if (error) { toast.error(error.message); return; }
    setStories((s) => s.filter((x) => x.id !== id));
    toast.success("Story deleted.");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Success Stories</h2>
          <p className="text-sm text-muted-foreground">
            Curate and publish stories of couples who met on United Disabled Matrimony.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> {showForm ? "Cancel" : "Add story"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <Label>Couple names</Label>
            <Input
              placeholder="e.g. Riya & Aman"
              value={form.couple_names}
              onChange={(e) => setForm({ ...form, couple_names: e.target.value })}
            />
          </div>
          <div>
            <Label>Story</Label>
            <Textarea
              rows={6}
              placeholder="How they met, what made them say yes…"
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://…"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Married on (optional)</Label>
              <Input
                type="date"
                value={form.married_on}
                onChange={(e) => setForm({ ...form, married_on: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-sm">Publish immediately</span>
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => setForm({ ...form, is_published: v })}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? "Saving…" : "Save story"}
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && stories.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            <Heart className="mx-auto h-6 w-6" />
            <p className="mt-2 text-sm">No stories yet. Add the first one to inspire members.</p>
          </li>
        )}
        {stories.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-start">
            {s.image_url && (
              <img src={s.image_url} alt={s.couple_names} className="h-24 w-24 flex-shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg">{s.couple_names}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.is_published ? "bg-emerald-500/15 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                  {s.is_published ? "Published" : "Hidden"}
                </span>
              </div>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{s.story}</p>
              {s.married_on && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Married {new Date(s.married_on).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2 sm:flex-col">
              <Button
                size="sm" variant="outline" className="rounded-full"
                onClick={() => togglePublish(s.id, !s.is_published)}
              >
                {s.is_published ? (
                  <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</>
                ) : (
                  <><Eye className="mr-1 h-3.5 w-3.5" /> Publish</>
                )}
              </Button>
              <Button
                size="sm" variant="destructive" className="rounded-full"
                onClick={() => remove(s.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}