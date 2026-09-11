"use client";

import { useState } from "react";
import { BADGE_PRESETS } from "@/lib/badges";
import type { TextEffect } from "@/lib/types";
import Badge from "@/components/Badge";
import NameText from "@/components/NameText";

const EFFECTS: { value: "" | TextEffect; label: string }[] = [
  { value: "", label: "Sin efecto" },
  { value: "blink", label: "Parpadeante" },
  { value: "shift", label: "Cambio de color suave" },
  { value: "pulse", label: "Pulso" },
  { value: "glow", label: "Brillo neón" },
  { value: "shake", label: "Sacudida" },
  { value: "outline", label: "Contorno" },
  { value: "rainbow", label: "Arcoíris (letra por letra)" },
  { value: "wavy", label: "Onda" },
  { value: "jump", label: "Salto secuencial" },
  { value: "spin", label: "Giro secuencial" },
  { value: "gradient", label: "Degradado" },
];

export default function BadgeStyleEditor({
  alias,
  isAdmin,
  currentBadge,
  currentColor,
  currentTextColor,
  currentEffect,
  currentNameColor,
  currentNameEffect,
  onToast,
  onBadgeChanged,
}: {
  alias: string;
  isAdmin: boolean;
  currentBadge?: string;
  currentColor?: string | null;
  currentTextColor?: string | null;
  currentEffect?: TextEffect | null;
  currentNameColor?: string | null;
  currentNameEffect?: TextEffect | null;
  onToast: (message: string) => void;
  onBadgeChanged: () => void;
}) {
  const [badgeDraft, setBadgeDraft] = useState(currentBadge ?? "");
  const [color, setColor] = useState(currentColor || "#1f5ad6");
  const [textColor, setTextColor] = useState(currentTextColor || "#ffffff");
  const [effect, setEffect] = useState<"" | TextEffect>(currentEffect ?? "");
  const [nameColor, setNameColor] = useState(currentNameColor || "#e8edf7");
  const [nameEffect, setNameEffect] = useState<"" | TextEffect>(currentNameEffect ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveBadgeText() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, badge: badgeDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      onBadgeChanged();
      onToast(badgeDraft.trim() ? "Rango actualizado" : "Rango removido");
    } finally {
      setBusy(false);
    }
  }

  async function saveStyle() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/badge-style", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color, textColor, ...(isAdmin ? { effect: effect || null } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      onBadgeChanged();
      onToast("Estilo de rango actualizado");
    } finally {
      setBusy(false);
    }
  }

  async function saveNameStyle() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/badge-style", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameColor, nameEffect: nameEffect || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        return;
      }
      onBadgeChanged();
      onToast("Nombre de usuario actualizado");
    } finally {
      setBusy(false);
    }
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          Tu rango
        </span>
        {badgeDraft.trim() && <Badge label={badgeDraft} color={color} textColor={textColor} effect={effect || null} />}
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      {isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {BADGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: 28, fontSize: 12 }}
              onClick={() => setBadgeDraft(preset.label)}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
          <input
            className="input"
            placeholder="Texto del rango"
            value={badgeDraft}
            onChange={(e) => setBadgeDraft(e.target.value)}
            maxLength={24}
            style={{ width: 170, minHeight: 32, fontSize: 12.5, background: "var(--color-neutral-100)" }}
          />
          <button type="button" className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} disabled={busy} onClick={saveBadgeText}>
            Guardar texto
          </button>
        </div>
      )}

      {currentBadge && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            Color
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 34,
                height: 28,
                padding: 0,
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-sm)",
                background: "none",
                cursor: "pointer",
              }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            Color del texto
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: 34,
                height: 28,
                padding: 0,
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-sm)",
                background: "none",
                cursor: "pointer",
              }}
            />
          </label>
          {isAdmin && (
            <select
              className="input"
              value={effect}
              onChange={(e) => setEffect(e.target.value as "" | TextEffect)}
              style={{ width: 190, minHeight: 32, fontSize: 12.5, background: "var(--color-neutral-100)" }}
            >
              {EFFECTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} disabled={busy} onClick={saveStyle}>
            Guardar estilo
          </button>
        </div>
      )}

      {isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid var(--color-divider)" }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            Tu nombre de usuario
          </span>
          <NameText text={alias} color={nameColor} effect={nameEffect || null} style={{ fontWeight: 600 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            Color
            <input
              type="color"
              value={nameColor}
              onChange={(e) => setNameColor(e.target.value)}
              style={{
                width: 34,
                height: 28,
                padding: 0,
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-sm)",
                background: "none",
                cursor: "pointer",
              }}
            />
          </label>
          <select
            className="input"
            value={nameEffect}
            onChange={(e) => setNameEffect(e.target.value as "" | TextEffect)}
            style={{ width: 190, minHeight: 32, fontSize: 12.5, background: "var(--color-neutral-100)" }}
          >
            {EFFECTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} disabled={busy} onClick={saveNameStyle}>
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
