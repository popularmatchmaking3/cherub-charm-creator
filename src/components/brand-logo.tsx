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
 * The supplied icon PNG ships with a hard white background. We drop it onto
 * cream/white surfaces with `mix-blend-mode: multiply`, which makes pure white
 * pixels disappear — no visible "sticker" square, no rounded chip frame.
 */
export function BrandLogo({ variant = "lockup", className, showTagline = false }: Props) {
  const Icon = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-16 w-16" : "h-10 w-10";
    return (
      <img
        src={iconAsset.url}
        alt=""
        aria-hidden="true"
        className={cn("shrink-0 object-contain mix-blend-multiply", dims)}
      />
    );
  };

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)} aria-label="United Disabled Matrimony">
        <Icon size="sm" />
      </span>
    );
  }

  if (variant === "full") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-3 text-center", className)}
        aria-label="United Disabled Matrimony — Love Without Limits"
      >
        <Icon size="lg" />
        <span className="flex flex-col items-center leading-none">
          <span className="font-display text-2xl leading-[1.15] tracking-tight text-foreground sm:text-3xl">
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
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon size="md" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-base leading-[1.1] tracking-tight text-foreground sm:text-xl">
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
