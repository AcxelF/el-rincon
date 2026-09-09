export const BADGE_PRESETS = [
  { label: "Moderador", icon: "🛡️" },
  { label: "Verificado", icon: "✅" },
  { label: "Colaborador", icon: "🤝" },
  { label: "VIP", icon: "👑" },
];

const DEFAULT_BADGE_ICON = "⭐";

export function iconForBadge(label: string): string {
  const preset = BADGE_PRESETS.find((p) => p.label.toLowerCase() === label.trim().toLowerCase());
  return preset?.icon ?? DEFAULT_BADGE_ICON;
}
