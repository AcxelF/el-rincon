"use client";

import type { RankingUser } from "@/lib/types";
import { formatKarma } from "@/lib/mock-data";
import { avatarForAlias, initials, podiumCardStyle } from "@/lib/style-helpers";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RankView({ ranking, onViewProfile }: { ranking: RankingUser[]; onViewProfile: (alias: string) => void }) {
  const podium = ranking.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 29, margin: "0 0 6px", lineHeight: 1.1 }}>Ranking del rincón</h1>
        <p style={{ margin: 0, fontSize: 14.5, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Karma acumulado por votos y likes recibidos en tus hilos y comentarios.
        </p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {podium.map((p, i) => (
          <div key={p.alias} className="alias-link-row" style={podiumCardStyle(i)} onClick={() => onViewProfile(p.alias)}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, lineHeight: 1 }}>{MEDALS[i]}</div>
            <div style={avatarForAlias(p.alias, 52)}>{initials(p.alias)}</div>
            <div className="alias-link-text" style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1.15 }}>{p.alias}</div>
            <div style={{ fontSize: 12.5, opacity: 0.75 }}>{p.meta}</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{formatKarma(p.karma)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 20px 16px", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}>
        {ranking.map((r, i) => (
          <div
            key={r.alias}
            className="alias-link-row"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}
            onClick={() => onViewProfile(r.alias)}
          >
            <span style={{ width: 26, fontFamily: "var(--font-heading)", fontSize: 16, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              {i + 1}
            </span>
            <div style={avatarForAlias(r.alias, 34)}>{initials(r.alias)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="alias-link-text" style={{ fontSize: 14.5, fontWeight: 600 }}>{r.alias}</div>
              <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>{r.meta}</div>
            </div>
            <span className="tag tag-accent-2">{r.badge}</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, width: 62, textAlign: "right" }}>{formatKarma(r.karma)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
