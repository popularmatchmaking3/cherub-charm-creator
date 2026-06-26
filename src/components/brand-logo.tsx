import iconAsset from "@/assets/udm-icon.png.asset.json";
import logoAsset from "@/assets/udm-logo.png.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "icon" | "full" | "lockup";
  className?: string;
  showTagline?: boolean;
};

/**
 * BrandLogo — single source of truth for United Disabled Matrimony branding.
 * - "icon"   : just the heart icon (use in nav bars, favicons, compact spots)
 * - "full"   : full logo image with text + tagline (use on auth pages, footer hero)
 * - "lockup" : icon + wordmark side by side (use in headers)
 */
export function BrandLogo({ variant = "lockup", className, showTagline = false }: Props) {
  if (variant === "icon") {
    return (
      <img
        src={iconAsset.url}
        alt="United Disabled Matrimony"
        className={cn("h-9 w-9 object-contain", className)}
        width={72}
        height={72}
      />
    );
  }

  if (variant === "full") {
    return (
      <img
        src={logoAsset.url}
        alt="United Disabled Matrimony — Love Without Limits"
        className={cn("h-auto w-full max-w-xs object-contain", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src={iconAsset.url}
        alt=""
        aria-hidden="true"
        className="h-9 w-9 shrink-0 object-contain"
        width={72}
        height={72}
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl tracking-tight text-foreground sm:text-2xl">
          United Disabled Matrimony
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Love Without Limits
          </span>
        )}
      </span>
    </span>
  );
}
