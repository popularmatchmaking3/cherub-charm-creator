import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/profile-options";
import { Camera, Pencil, Settings, BadgeCheck, Heart } from "lucide-react";
import { calcCompletion } from "@/lib/profile-completion";
import { useServerFn } from "@tanstack/react-start";
import { claimFirstAdmin, getAdminPresence } from "@/lib/admin.functions";
import { useIsAdmin } from "@/lib/use-is-admin";

export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({ meta: [{ title: "My Profile — United Disabled Matrimony" }] }),
  component: ProfilePage,
});

interface Profile {
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  disability_category: string | null;
  disability_percentage: number | null;
  religion: string | null;
  mother_tongue: string | null;
  marital_status: string | null;
  education: string | null;
  occupation: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  about: string | null;
  partner_preferences: string | null;
  avatar_url: string | null;
  is_profile_complete: boolean;
  is_verified: boolean;
  disability_verified: boolean;
}

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const isAdmin = useIsAdmin();
  const claim = useServerFn(claimFirstAdmin);
  const checkAdmins = useServerFn(getAdminPresence);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
    if (data && !data.is_profile_complete) navigate({ to: "/onboarding" });
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user]);

  useEffect(() => {
    checkAdmins()
      .then((r) => setHasAdmin(r.hasAdmin))
      .catch(() => setHasAdmin(true));
  }, [checkAdmins]);

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Photo updated");
    load();
  };

  if (loading) {
    return <div className="px-6 py-10 text-muted-foreground">Loading…</div>;
  }

  if (!profile) return null;

  const age = profile.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  const completion = calcCompletion(profile);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">My profile</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-4xl">
            {profile.full_name || "Your profile"}
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {profile.disability_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <Heart className="h-3.5 w-3.5" /> Disability verified
              </span>
            )}
          </h1>
        </div>
        <Link to="/onboarding">
          <Button variant="outline" className="rounded-full">
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Profile completion</p>
          <p className="font-display text-lg">{completion.percent}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completion.percent}%` }}
          />
        </div>
        {completion.percent < 100 && completion.missing.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Missing: {completion.missing.slice(0, 4).join(", ")}
            {completion.missing.length > 4 ? `, +${completion.missing.length - 4} more` : ""}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Link to="/settings">
          <Button variant="outline" size="sm" className="rounded-full">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-secondary">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatar(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : profile.avatar_url ? "Change photo" : "Add photo"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, up to 5 MB.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="Age" value={age ? `${age} years` : "—"} />
        <Info label="Gender" value={cap(profile.gender)} />
        <Info label="Marital status" value={cap(profile.marital_status?.replace("_", " "))} />
        <Info
          label="Disability"
          value={`${categoryLabel(profile.disability_category)} · ${profile.disability_percentage ?? 0}%`}
        />
        <Info label="Religion" value={profile.religion || "—"} />
        <Info label="Mother tongue" value={profile.mother_tongue || "—"} />
        <Info label="Education" value={profile.education || "—"} />
        <Info label="Occupation" value={profile.occupation || "—"} />
        <Info
          label="Location"
          value={[profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "—"}
        />
      </div>

      {profile.about && <Section title="About">{profile.about}</Section>}
      {profile.partner_preferences && (
        <Section title="Looking for">{profile.partner_preferences}</Section>
      )}

      {!isAdmin && hasAdmin === false && (
        <section className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            First-time setup
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            No admin assigned yet? Claim admin to verify other members.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                const res = await claim();
                if (res.ok) {
                  toast.success("You are now an admin");
                  window.location.reload();
                } else toast.error(res.reason ?? "Could not claim admin");
              } catch (e) {
                toast.error((e as Error).message);
              }
              setClaiming(false);
            }}
          >
            {claiming ? "Working…" : "Claim admin role"}
          </Button>
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="mt-2 whitespace-pre-line leading-relaxed">{children}</p>
    </section>
  );
}

function cap(s?: string | null) {
  if (!s) return "—";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
