"use client";

import { useState } from "react";
import type { DecoratedPoll } from "@/lib/types";

type PollDisplayMode = "pct" | "votes";

const modeBtn = (active: boolean): React.CSSProperties => ({
  padding: "2px 9px",
  border: active ? "1px solid transparent" : "1px solid var(--color-divider)",
  borderRadius: 999,
  background: active ? "var(--color-accent)" : "transparent",
  color: active ? "var(--color-neutral-100)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
  fontSize: 10.5,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  fontFamily: "inherit",
});

export default function Poll({ poll, onVote }: { poll: DecoratedPoll; onVote: (optionId: number) => void }) {
  const [mode, setMode] = useState<PollDisplayMode>("pct");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {poll.options.map((o) => {
        const mine = poll.myVote === o.id;
        return (
          <button
            key={o.id}
            className="chip-btn"
            onClick={() => onVote(o.id)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: mine ? "1px solid var(--color-accent)" : "1px solid var(--color-divider)",
              background: "var(--color-neutral-100)",
              overflow: "hidden",
              textAlign: "left",
              cursor: "pointer",
              fontSize: 13.5,
              fontFamily: "inherit",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: `${o.pct}%`,
                background: mine ? "var(--color-accent-200)" : "color-mix(in srgb, var(--color-text) 8%, transparent)",
                transition: "width 260ms var(--ease-out)",
              }}
            />
            <span style={{ position: "relative", fontWeight: mine ? 600 : 500 }}>
              {mine ? "✓ " : ""}
              {o.text}
            </span>
            <span style={{ position: "relative", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              {mode === "pct" ? `${o.pct}%` : o.votes}
            </span>
          </button>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
          {poll.totalVotes} {poll.totalVotes === 1 ? "voto" : "votos"}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" style={modeBtn(mode === "pct")} onClick={() => setMode("pct")}>
            %
          </button>
          <button type="button" style={modeBtn(mode === "votes")} onClick={() => setMode("votes")}>
            Votos
          </button>
        </div>
      </div>
    </div>
  );
}
