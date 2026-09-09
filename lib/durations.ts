export const DURATIONS: { label: string; ms?: number }[] = [
  { label: "Permanente" },
  { label: "1 hora", ms: 60 * 60 * 1000 },
  { label: "24 horas", ms: 24 * 60 * 60 * 1000 },
  { label: "7 días", ms: 7 * 24 * 60 * 60 * 1000 },
];

export function formatUntil(until: number): string {
  return new Date(until).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
