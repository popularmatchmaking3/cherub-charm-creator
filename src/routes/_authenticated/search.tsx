import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DISABILITY_CATEGORIES, GENDERS, MARITAL_STATUSES, RELIGIONS,
} from "@/lib/profile-options";
import { LocationPicker } from "@/components/location-picker";
import { MapPin, Search as SearchIcon, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — United Disabled Matrimony" }] }),
  component: SearchPage,
});

type Gender = "male" | "female" | "other";

interface SearchFilters {
  gender: Gender | "any";
  minAge: string;
  maxAge: string;
  disability: string;
  marital: string;
  religion: string;
  country: string;
  state: string;
  city: string;
  verifiedOnly: boolean;
  withPhoto: boolean;
}

interface ResultRow {
  id: string;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  disability_category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  disability_verified: boolean;
  last_seen_at: string | null;
  show_online_status: boolean | null;
}

const DEFAULT_FILTERS: SearchFilters = {
  gender: "any",
  minAge: "",
  maxAge: "",
  disability: "any",
  marital: "any",
  religion: "any",
  country: "",
  state: "",
  city: "",
  verifiedOnly: false,
  withPhoto: false,
};

function ageToDob(years: number, ceiling: boolean): string {
  // For minAge: dob must be <= today - minAge years
  // For maxAge: dob must be >= today - (maxAge+1) years + 1 day
  const d = new Date();
  d.setFullYear(d.getFullYear() - years - (ceiling ? 1 : 0));
  if (ceiling) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function SearchPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [pending, setPending] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const update = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    setPending((p) => ({ ...p, [k]: v }));

  const runSearch = async () => {
    if (!user) return;
    setFilters(pending);
    setLoading(true);
    setSearched(true);
    let q = supabase
      .from("profiles")
      .select(
        "id, full_name, gender, date_of_birth, disability_category, city, state, country, avatar_url, is_verified, disability_verified, last_seen_at, show_online_status",
      )
      .eq("is_profile_complete", true)
      .eq("is_hidden", false)
      .neq("id", user.id)
      .limit(60);

    if (pending.gender !== "any") q = q.eq("gender", pending.gender);
    if (pending.disability !== "any") q = q.eq("disability_category", pending.disability as never);
    if (pending.marital !== "any") q = q.eq("marital_status", pending.marital as never);
    if (pending.religion !== "any") q = q.eq("religion", pending.religion);
    if (pending.country.trim()) q = q.ilike("country", `%${pending.country.trim()}%`);
    if (pending.state.trim()) q = q.ilike("state", `%${pending.state.trim()}%`);
    if (pending.city.trim()) q = q.ilike("city", `%${pending.city.trim()}%`);
    if (pending.verifiedOnly) q = q.eq("is_verified", true);
    if (pending.withPhoto) q = q.not("avatar_url", "is", null);

    const minA = Number(pending.minAge);
    const maxA = Number(pending.maxAge);
    if (Number.isFinite(minA) && minA > 0) q = q.lte("date_of_birth", ageToDob(minA, false));
    if (Number.isFinite(maxA) && maxA > 0) q = q.gte("date_of_birth", ageToDob(maxA, true));

    const { data, error } = await q;
    setLoading(false);
    if (error) return;
    setRows((data ?? []) as ResultRow[]);
  };

  const reset = () => {
    setPending(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setRows([]);
    setSearched(false);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.gender !== "any") n++;
    if (filters.minAge || filters.maxAge) n++;
    if (filters.disability !== "any") n++;
    if (filters.marital !== "any") n++;
    if (filters.religion !== "any") n++;
    if (filters.country.trim() || filters.state.trim() || filters.city.trim()) n++;
    if (filters.verifiedOnly) n++;
    if (filters.withPhoto) n++;
    return n;
  }, [filters]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Find members</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Search profiles</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Narrow down by age, gender, disability category, religion, district and more. All members shown have completed their profile.
      </p>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Looking for">
            <Select value={pending.gender} onValueChange={(v) => update("gender", v as Gender | "any")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any gender</SelectItem>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Age (min)">
            <Input
              type="number" inputMode="numeric" min={18} max={80}
              placeholder="18"
              value={pending.minAge}
              onChange={(e) => update("minAge", e.target.value)}
            />
          </Field>

          <Field label="Age (max)">
            <Input
              type="number" inputMode="numeric" min={18} max={80}
              placeholder="60"
              value={pending.maxAge}
              onChange={(e) => update("maxAge", e.target.value)}
            />
          </Field>

          <Field label="Disability category">
            <Select value={pending.disability} onValueChange={(v) => update("disability", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {DISABILITY_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Marital status">
            <Select value={pending.marital} onValueChange={(v) => update("marital", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                {MARITAL_STATUSES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Religion">
            <Select value={pending.religion} onValueChange={(v) => update("religion", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any religion</SelectItem>
                {RELIGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="sm:col-span-2 lg:col-span-3">
            <LocationPicker
              value={{ country: pending.country, state: pending.state, city: pending.city }}
              onChange={(v) => {
                update("country", v.country);
                update("state", v.state);
                update("city", v.city);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <div>
              <p className="text-sm font-medium">Verified only</p>
              <p className="text-[11px] text-muted-foreground">Members with verified ID</p>
            </div>
            <Switch
              checked={pending.verifiedOnly}
              onCheckedChange={(v) => update("verifiedOnly", v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <div>
              <p className="text-sm font-medium">With photo</p>
              <p className="text-[11px] text-muted-foreground">Only profiles with a picture</p>
            </div>
            <Switch
              checked={pending.withPhoto}
              onCheckedChange={(v) => update("withPhoto", v)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={reset} className="rounded-full">
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button onClick={runSearch} disabled={loading} className="rounded-full">
            <SearchIcon className="mr-1 h-4 w-4" /> {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </section>

      <section className="mt-8">
        {searched && (
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {loading ? "Searching…" : `${rows.length} result${rows.length === 1 ? "" : "s"} · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`}
          </p>
        )}
        {searched && !loading && rows.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No members match these filters. Try widening your search.
          </div>
        )}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
            >
              <Link to="/profile/$id" params={{ id: r.id }} className="block p-5">
                <p className="font-display text-2xl uppercase tracking-wide leading-tight truncate">
                  {r.full_name ?? "Member"}
                </p>
                {(r.city || r.state || (r as { country?: string | null }).country) && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {[r.city, r.state, (r as { country?: string | null }).country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}