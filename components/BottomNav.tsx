"use client";

import type { View } from "@/lib/types";

export default function BottomNav({
  view,
  onTabClick,
  isAdmin,
  reportsCount,
}: {
  view: View;
  onTabClick: (v: View) => void;
  isAdmin: boolean;
  reportsCount: number;
}) {
  const items: [View, string, string][] = [
    ["feed", "🏠", "Inicio"],
    ["rank", "🏆", "Ranking"],
  ];
  if (isAdmin) items.push(["admin", "🛡️", "Admin"]);

  return (
    <nav className="bottom-nav">
      {items.map(([key, icon, label]) => {
        const active = view === key || (key === "feed" && view === "thread");
        return (
          <button
            key={key}
            className="bottom-nav-item chip-btn"
            onClick={() => onTabClick(key)}
            style={{ color: active ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
          >
            <span style={{ position: "relative", fontSize: 20, lineHeight: 1 }}>
              {icon}
              {key === "admin" && reportsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    minWidth: 14,
                    height: 14,
                    padding: "0 3px",
                    borderRadius: 999,
                    background: "var(--color-accent-2)",
                    color: "var(--color-neutral-100)",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {reportsCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
