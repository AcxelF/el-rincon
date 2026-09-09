"use client";

import { useState } from "react";
import { CaretDown, CaretUp, MagnifyingGlass, Star, X } from "@phosphor-icons/react";
import type { Category } from "@/lib/types";
import { PILL, PILL_ON } from "@/lib/style-helpers";
import { iconForCategory } from "@/lib/category-icons";
import { useHoverTooltip } from "@/lib/use-hover-tooltip";

const SECTION_LABEL_STYLE = {
  fontSize: 11,
  letterSpacing: ".12em",
  textTransform: "uppercase" as const,
  color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
  padding: "10px 12px 8px",
};

export default function RailLeft({
  activeCat,
  counts,
  categories,
  onPick,
  followedCategoryIds,
  onToggleFollowCategory,
  variant = "sidebar",
  onClose,
}: {
  activeCat: string;
  counts: Record<string, number>;
  categories: Category[];
  onPick: (id: string) => void;
  followedCategoryIds: string[];
  onToggleFollowCategory: (id: string) => void;
  variant?: "sidebar" | "drawer";
  onClose?: () => void;
}) {
  const [careersOpen, setCareersOpen] = useState(false);
  const [careerQuery, setCareerQuery] = useState("");
  const { show: showTooltip, hide: hideTooltip, portal: tooltipPortal } = useHoverTooltip();

  const topics = categories.filter((c) => c.group !== "carrera");
  const careers = categories.filter((c) => c.group === "carrera");
  const followedCareers = careers.filter((c) => followedCategoryIds.includes(c.id));
  const otherCareers = careers
    .filter((c) => !followedCategoryIds.includes(c.id))
    .filter((c) => c.name.toLowerCase().includes(careerQuery.trim().toLowerCase()));

  function renderRow(c: Category, options?: { isCareer?: boolean }) {
    const Icon = iconForCategory(c.id);
    const followed = followedCategoryIds.includes(c.id);
    return (
      <div key={c.id} className="rail-item" style={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <button
          className="chip-btn"
          style={{ ...(activeCat === c.id ? PILL_ON : PILL), flex: 1, minWidth: 0 }}
          onClick={() => onPick(c.id)}
          onMouseEnter={(e) => showTooltip(e, c.name)}
          onMouseLeave={hideTooltip}
          onFocus={(e) => showTooltip(e, c.name)}
          onBlur={hideTooltip}
        >
          {Icon ? <Icon size={18} weight="regular" aria-hidden style={{ flex: "none" }} /> : <span style={{ fontSize: 15, flex: "none" }}>{c.emoji}</span>}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.name}
          </span>
          <span style={{ fontSize: 11, opacity: 0.6, flex: "none" }}>{counts[c.id] ?? 0}</span>
        </button>
        {options?.isCareer && (
          <button
            type="button"
            className="icon-btn"
            aria-label={followed ? `Dejar de seguir ${c.name}` : `Seguir ${c.name}`}
            title={followed ? `Dejar de seguir ${c.name}` : `Seguir ${c.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollowCategory(c.id);
            }}
            style={{
              display: "grid",
              placeItems: "center",
              width: 26,
              height: 26,
              flex: "none",
              border: 0,
              borderRadius: 999,
              background: "transparent",
              color: followed ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
              cursor: "pointer",
            }}
          >
            <Star size={16} weight={followed ? "fill" : "regular"} />
          </button>
        )}
      </div>
    );
  }

  const rail = (
    <nav
      className={variant === "drawer" ? "rail-left rail-left-drawer" : "rail-left"}
      style={{ display: "flex", flexDirection: "column", gap: 3 }}
      onScroll={hideTooltip}
    >
      {variant === "drawer" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 12px 10px" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Categorías</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cerrar menú"
            onClick={onClose}
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 999,
              border: 0,
              background: "color-mix(in srgb, var(--color-text) 8%, transparent)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <span className="rail-hide" style={SECTION_LABEL_STYLE}>
        Temas
      </span>
      {topics.map((c) => renderRow(c))}

      {followedCareers.length > 0 && (
        <>
          <span className="rail-hide" style={SECTION_LABEL_STYLE}>
            Tu carrera
          </span>
          {followedCareers.map((c) => renderRow(c, { isCareer: true }))}
        </>
      )}

      <div className="rail-hide" style={{ height: 1, background: "var(--color-divider)", margin: "8px 12px 2px" }} />
      <button
        type="button"
        className="chip-btn"
        onClick={() => setCareersOpen((o) => !o)}
        style={{
          ...SECTION_LABEL_STYLE,
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          border: 0,
          background: "transparent",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>Carreras</span>
        {careersOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
      </button>

      {careersOpen && (
        <>
          {careers.length > 6 && (
            <div className="rail-hide" style={{ padding: "4px 12px 2px", position: "relative" }}>
              <MagnifyingGlass
                size={14}
                style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}
              />
              <input
                className="input"
                placeholder="Buscar carrera…"
                value={careerQuery}
                onChange={(e) => setCareerQuery(e.target.value)}
                style={{ minHeight: 32, fontSize: 12.5, paddingLeft: 30, background: "var(--color-neutral-100)" }}
              />
            </div>
          )}
          {otherCareers.map((c) => renderRow(c, { isCareer: true }))}
          {otherCareers.length === 0 && (
            <div className="rail-hide" style={{ padding: "4px 12px", fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
              No encontramos esa carrera.
            </div>
          )}
        </>
      )}

      <div className="rail-hide" style={{ height: 1, background: "var(--color-divider)", margin: "14px 12px" }} />
      <div className="rail-hide" style={{ padding: 16, borderRadius: "var(--radius-lg)", background: "var(--color-accent-2-200)" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, lineHeight: 1.15, marginBottom: 6 }}>Reglas del rincón</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--color-accent-2-900)" }}>
          Cero funas, cero spam, cero tareas. Aquí solo se viene a hacer amigos y perder el tiempo bonito.
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {rail}
      {tooltipPortal}
    </>
  );
}
