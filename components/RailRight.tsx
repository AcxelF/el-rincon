"use client";

import type { RankingUser } from "@/lib/types";
import { formatKarma } from "@/lib/mock-data";
import { avatarForAlias, initials } from "@/lib/style-helpers";

export default function RailRight({ ranking, onGoRank }: { ranking: RankingUser[]; onGoRank: () => void }) {
  const topPeople = ranking.slice(0, 4);

  return (
    <aside className="rail-right" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "18px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span
            style={{
              flex: 1,
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            Populares de la semana
          </span>
          <button className="btn btn-ghost" style={{ minHeight: 26, fontSize: 12, padding: "0 6px" }} onClick={onGoRank}>
            Ver todo
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 50%, transparent)", marginBottom: 12 }}>
          Karma acumulado por likes y votos recibidos.
        </div>
        {topPeople.map((u) => (
          <div key={u.alias} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div style={avatarForAlias(u.alias, 34)}>{initials(u.alias)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.alias}</div>
              <div style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>{u.meta}</div>
            </div>
            <span className="tag tag-neutral">🔥 {formatKarma(u.karma)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
