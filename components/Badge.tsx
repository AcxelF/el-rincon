import { iconForBadge } from "@/lib/badges";

export default function Badge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="tag" style={{ background: "var(--color-accent-800)", color: "var(--color-neutral-100)", fontWeight: 600 }}>
      {iconForBadge(label)} {label}
    </span>
  );
}
