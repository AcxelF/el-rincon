import { iconForBadge } from "@/lib/badges";
import type { TextEffect } from "@/lib/types";
import NameText from "@/components/NameText";

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
  return (
    <span className="tag" style={{ background: color || "var(--color-accent-800)", color: textColor || "var(--color-neutral-100)", fontWeight: 600 }}>
      {iconForBadge(label)} <NameText text={label} color={textColor} effect={effect} />
    </span>
  );
}
