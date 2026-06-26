import { useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";
import indiaData from "@/data/india-states-districts.json";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";

type IndiaRegion = { name: string; districts: string[] };
type IndiaData = { states: IndiaRegion[]; union_territories: IndiaRegion[] };
const INDIA = indiaData as IndiaData;

function getDistrictsByState(stateName: string): string[] | null {
  if (!stateName) return null;
  const needle = stateName.toLowerCase();
  const all = [...INDIA.states, ...INDIA.union_territories];
  return all.find((r) => r.name.toLowerCase() === needle)?.districts ?? null;
}
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type LocationValue = {
  country: string;
  state: string;
  city: string;
};

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  showCity?: boolean;
  showState?: boolean;
  className?: string;
};

/**
 * Searchable Country / State / City picker backed by the `country-state-city`
 * dataset (~250 countries, 5k+ states, 150k+ cities — worldwide).
 */
export function LocationPicker({
  value,
  onChange,
  showCity = true,
  showState = true,
  className,
}: Props) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === value.country),
    [countries, value.country],
  );
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    const list = State.getStatesOfCountry(selectedCountry.isoCode) ?? [];
    const seen = new Set<string>();
    return list
      .filter((s) => {
        const k = s.name.trim().toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCountry]);
  const selectedState = useMemo(
    () => states.find((s) => s.name === value.state),
    [states, value.state],
  );
  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    // India → real district list (e.g. Maharashtra = 36 districts, not 300+ cities).
    if (selectedCountry.isoCode === "IN" && selectedState) {
      try {
        const districts = getDistrictsByState(selectedState.name) ?? [];
        const seen = new Set<string>();
        return districts
          .map((d) => String(d).trim())
          .filter((n) => {
            const k = n.toLowerCase();
            if (!n || seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .sort((a, b) => a.localeCompare(b));
      } catch {
        /* fall through to city dataset */
      }
    }
    const list = selectedState
      ? (City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) ?? [])
      : (City.getCitiesOfCountry(selectedCountry.isoCode) ?? []);
    const seen = new Set<string>();
    return list
      .map((c) => c.name.trim())
      .filter((name) => {
        const key = name.toLowerCase();
        if (!name || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [selectedCountry, selectedState]);

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      <ComboField
        label="Country"
        placeholder="Select country"
        emptyText="No country found."
        value={value.country}
        items={countries.map((c) => ({
          value: c.name,
          label: `${c.flag ?? ""} ${c.name}`.trim(),
          raw: c.name,
          keywords: [c.isoCode],
        }))}
        onSelect={(name) => onChange({ country: name, state: "", city: "" })}
      />

      {showState && (
        <ComboField
          label="State / Province"
          placeholder={
            !value.country
              ? "Select country first"
              : states.length === 0
                ? "No states — type city below"
                : "Select state"
          }
          emptyText="No state found."
          value={value.state}
          disabled={!value.country || states.length === 0}
          items={states.map((s) => ({ value: s.name, label: s.name }))}
          onSelect={(name) => onChange({ ...value, state: name, city: "" })}
        />
      )}

      {showCity && (
        <ComboField
          label="District"
          placeholder={
            !value.country
              ? "Select country first"
              : cities.length === 0
                ? "No districts listed"
                : "Select district"
          }
          emptyText="No district found."
          value={value.city}
          disabled={!value.country || cities.length === 0}
          items={cities.map((name) => ({ value: name, label: name, raw: name }))}
          onSelect={(_v, raw) => onChange({ ...value, city: raw ?? _v })}
        />
      )}
    </div>
  );
}

type Item = { value: string; label: string; keywords?: string[]; raw?: string };

function ComboField({
  label,
  placeholder,
  emptyText,
  value,
  items,
  onSelect,
  disabled,
}: {
  label: string;
  placeholder: string;
  emptyText: string;
  value: string;
  items: Item[];
  onSelect: (value: string, raw?: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const display = value || placeholder;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">{display}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search) => {
              // itemValue is lowercased automatically by cmdk
              return itemValue.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const display = item.raw ?? item.label;
                  const isSelected = value === display;
                  return (
                    <CommandItem
                      key={item.value}
                      value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                      onSelect={() => {
                        onSelect(display, item.raw);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                      />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
