import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, changeLanguage, type LanguageCode } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface Props {
  /** When true, render only the icon dropdown (used in nav). */
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: Props) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [value, setValue] = useState<LanguageCode>((i18n.language?.split("-")[0] as LanguageCode) || "en");

  // Hydrate from saved profile preference once authenticated.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const pref = (data as { preferred_language?: string } | null)?.preferred_language;
        if (pref && pref !== i18n.language) {
          changeLanguage(pref as LanguageCode);
          setValue(pref as LanguageCode);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onChange = async (next: LanguageCode) => {
    setValue(next);
    changeLanguage(next);
    if (user) {
      await supabase.from("profiles").update({ preferred_language: next }).eq("id", user.id);
    }
  };

  if (compact) {
    return (
      <Select value={value} onValueChange={(v) => onChange(v as LanguageCode)}>
        <SelectTrigger aria-label="Language" className="h-9 w-auto gap-1 rounded-full border-border px-3 text-xs">
          <Globe className="h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SUPPORTED_LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => onChange(v as LanguageCode)}>
      <SelectTrigger className="w-full sm:w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}