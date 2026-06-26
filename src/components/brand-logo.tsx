import iconAsset from "@/assets/udm-icon.png.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "icon" | "full" | "lockup";
  className?: string;
  showTagline?: boolean;
};

/**
 * BrandLogo — single source of truth for United Disabled Matrimony branding.
 *
 * The supplied logo PNGs ship with a hard white background. To keep the brand
 * looking intentional on cream surfaces, the icon is always presented inside a
 * white rounded chip with a subtle border, instead of being dropped directly
 * onto the page where the white square would clash.
 *
 * - "icon"   : icon chip only (compact spots, nav bars)
 * - "lockup" : icon chip + wordmark side by side (headers, footers)
 * - "full"   : centered icon chip + wordmark + tagline (auth screens, hero spots)
 */
export function BrandLogo({ variant = "lockup", className, showTagline = false }: Props) {
  const IconChip = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const dims =
      size === "sm" ? "h-9 w-9 p-1" : size === "lg" ? "h-20 w-20 p-2" : "h-11 w-11 p-1.5";
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,27,61,0.08)] ring-1 ring-[color:var(--border)]",
          dims,
        )}
      >
        <img
          src={iconAsset.url}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
        />
      </span>
    );
  };

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)} aria-label="United Disabled Matrimony">
        <IconChip size="sm" />
      </span>
    );
  }

  if (variant === "full") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-3 text-center", className)}
        aria-label="United Disabled Matrimony — Love Without Limits"
      >
        <IconChip size="lg" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
            United Disabled Matrimony
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            Love Without Limits
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <IconChip size="md" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl tracking-tight text-foreground sm:text-[1.35rem]">
          United Disabled Matrimony
        </span>
        {showTagline && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Love Without Limits
          </span>
        )}
      </span>
    </span>
  );
}
