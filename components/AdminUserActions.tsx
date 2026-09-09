"use client";

import { useEffect, useState } from "react";
import { BADGE_PRESETS } from "@/lib/badges";
import { DURATIONS, formatUntil } from "@/lib/durations";

interface AdminUserInfo {
  alias: string;
  isBanned: boolean;
  isMuted: boolean;
  bannedUntil: number | null;
  mutedUntil: number | null;
  badge: string | null;
}

export default function AdminUserActions({
  alias,
  onToast,
  onBadgeChanged,
}: {
  alias: string;
  onToast: (message: string) => void;
  onBadgeChanged: () => void;
}) {
  const [info, setInfo] = useState<AdminUserInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [durationIndex, setDurationIndex] = useState(0);
  const [badgeDraft, setBadgeDraft] = useState<string | null>(null);

  function refresh() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.users || []).find((u: AdminUserInfo) => u.alias === alias);
        if (found) {
          setInfo(found);
          setBadgeDraft((d) => (d === null ? found.badge || "" : d));
        }
      })
      .catch(() => setError("No se pudo cargar el estado de este usuario."));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBadgeDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alias]);

  async function runAction(path: string, body: Record<string, unknown>, onOk?: () => void) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar.");
        return;
      }
      refresh();
      onOk?.();
    } finally {
      setBusy(false);
    }
  }

  if (!info) return null;

  const durationLabel = DURATIONS[durationIndex].label;

  function toggleBan() {
    const banned = !info!.isBanned;
    const ms = banned ? DURATIONS[durationIndex].ms : undefined;
    runAction("/api/admin/ban", { alias, banned, durationMs: ms }, () =>
      onToast(banned ? `${alias} fue baneado${ms ? ` por ${durationLabel.toLowerCase()}` : ""}` : `${alias} fue desbaneado`)
    );
  }

  function toggleMute() {
    const muted = !info!.isMuted;
    const ms = muted ? DURATIONS[durationIndex].ms : undefined;
    runAction("/api/admin/mute", { alias, muted, durationMs: ms }, () =>
      onToast(muted ? `${alias} fue silenciado${ms ? ` por ${durationLabel.toLowerCase()}` : ""}` : `Se reactivó la voz de ${alias}`)
    );
  }

  function saveBadge() {
    const clean = badgeDraft ?? "";
    runAction("/api/admin/badge", { alias, badge: clean }, () => {
      onBadgeChanged();
      onToast(clean ? `Insignia actualizada para ${alias}` : `Insignia removida de ${alias}`);
    });
  }

  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          Herramientas de admin
        </span>
        {info.isBanned && <span className="tag tag-accent-2">Baneado{info.bannedUntil ? ` hasta ${formatUntil(info.bannedUntil)}` : ""}</span>}
        {info.isMuted && <span className="tag tag-accent-2">Silenciado{info.mutedUntil ? ` hasta ${formatUntil(info.mutedUntil)}` : ""}</span>}
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {!(info.isMuted && info.isBanned) && (
          <select
            className="input"
            value={durationIndex}
            onChange={(e) => setDurationIndex(Number(e.target.value))}
            style={{ width: 130, minHeight: 34, fontSize: 12.5, background: "var(--color-neutral-100)" }}
          >
            {DURATIONS.map((d, i) => (
              <option key={d.label} value={i}>
                {d.label}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-secondary" style={{ minHeight: 34, fontSize: 12.5 }} disabled={busy} onClick={toggleMute}>
          {info.isMuted ? "Reactivar voz" : "Silenciar"}
        </button>
        <button
          className="btn btn-secondary"
          style={{ minHeight: 34, fontSize: 12.5, color: info.isBanned ? undefined : "var(--color-accent-2-700)" }}
          disabled={busy}
          onClick={toggleBan}
        >
          {info.isBanned ? "Desbanear" : "Banear"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {BADGE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="btn btn-ghost"
            style={{ minHeight: 28, fontSize: 12 }}
            onClick={() => setBadgeDraft(preset.label)}
          >
            {preset.icon} {preset.label}
          </button>
        ))}
        <input
          className="input"
          placeholder="Insignia / rango personalizado"
          value={badgeDraft ?? ""}
          onChange={(e) => setBadgeDraft(e.target.value)}
          style={{ width: 190, minHeight: 32, fontSize: 12.5, background: "var(--color-neutral-100)" }}
        />
        <button className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} disabled={busy} onClick={saveBadge}>
          Guardar insignia
        </button>
      </div>
    </div>
  );
}
