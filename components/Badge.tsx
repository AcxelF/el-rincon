import { iconForBadge } from "@/lib/badges";
import type { TextEffect } from "@/lib/types";

export default function Badge({
  label,
  color,
  textColor,
  effect,
}: {
  label?: string | null;
  color?: string | null;
  textColor?: string | null;
  effect?: TextEffect | null;
}) {
  if (!label) return null;
  const className = ["tag", effect ? `text-effect-${effect}` : ""].filter(Boolean).join(" ");
  return (
    <span className={className} style={{ background: color || "var(--color-accent-800)", color: textColor || "var(--color-neutral-100)", fontWeight: 600 }}>
      {iconForBadge(label)} {label}
    </span>
  );
}
