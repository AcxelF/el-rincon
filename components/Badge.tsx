import { iconForBadge } from "@/lib/badges";

export default function Badge({
  label,
  color,
  textColor,
  effect,
}: {
  label?: string;
  color?: string | null;
  textColor?: string | null;
  effect?: "blink" | "shift" | null;
}) {
  if (!label) return null;
  const className = ["tag", effect === "blink" ? "badge-blink" : "", effect === "shift" ? "badge-shift" : ""].filter(Boolean).join(" ");
  return (
    <span className={className} style={{ background: color || "var(--color-accent-800)", color: textColor || "var(--color-neutral-100)", fontWeight: 600 }}>
      {iconForBadge(label)} {label}
    </span>
  );
}
