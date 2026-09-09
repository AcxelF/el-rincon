import type { CSSProperties } from "react";

type Tone = [bg: string, fg: string];

export function toneFor(alias: string): Tone {
  if (alias.indexOf("an") === 0) return ["neutral-300", "neutral-900"];
  const n = alias.length % 3;
  return n === 0 ? ["accent-300", "accent-900"] : n === 1 ? ["accent-2-300", "accent-2-900"] : ["neutral-300", "neutral-900"];
}

export function avatarStyle(bg: string, fg: string, size: number): CSSProperties {
  return {
    width: size,
    height: size,
    flex: "none",
    borderRadius: 999,
    background: `var(--color-${bg})`,
    color: `var(--color-${fg})`,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    fontSize: Math.round(size * 0.34),
  };
}

export function avatarForAlias(alias: string, size: number): CSSProperties {
  const [bg, fg] = toneFor(alias);
  return avatarStyle(bg, fg, size);
}

export function initials(alias: string): string {
  const s = alias.replace("@", "");
  if (s.indexOf("anónimo") === 0) return "??";
  const parts = s.split(/[.\s_]+/).filter(Boolean);
  return (((parts[0] || "?")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase();
}

export const PILL: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 12px",
  border: 0,
  borderRadius: 999,
  background: "transparent",
  fontSize: 14,
  color: "var(--color-text)",
  cursor: "pointer",
  textAlign: "left",
};

export const PILL_ON: CSSProperties = {
  ...PILL,
  background: "var(--color-accent-200)",
  color: "var(--color-accent-900)",
  fontWeight: 600,
};

export const TAB: CSSProperties = {
  padding: "7px 14px",
  border: 0,
  borderRadius: 999,
  background: "transparent",
  fontSize: 14,
  color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
  cursor: "pointer",
};

export const TAB_ON: CSSProperties = {
  padding: "7px 14px",
  border: 0,
  borderRadius: 999,
  background: "var(--color-accent-200)",
  fontSize: 14,
  color: "var(--color-accent-900)",
  fontWeight: 600,
  cursor: "pointer",
};

export const SORT: CSSProperties = {
  padding: "6px 14px",
  border: "1px solid var(--color-divider)",
  borderRadius: 999,
  background: "transparent",
  fontSize: 13,
  color: "var(--color-text)",
  cursor: "pointer",
};

export const SORT_ON: CSSProperties = {
  padding: "6px 14px",
  border: "1px solid transparent",
  borderRadius: 999,
  background: "var(--color-accent)",
  fontSize: 13,
  color: "var(--color-neutral-100)",
  cursor: "pointer",
  fontWeight: 600,
};

export const ARROW: CSSProperties = {
  width: 30,
  height: 26,
  border: 0,
  borderRadius: 10,
  background: "transparent",
  color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
  fontSize: 13,
  cursor: "pointer",
  lineHeight: 1,
};

export const ARROW_UP: CSSProperties = {
  ...ARROW,
  background: "var(--color-accent-200)",
  color: "var(--color-accent-800)",
};

export const ARROW_DOWN: CSSProperties = {
  ...ARROW,
  background: "var(--color-accent-2-200)",
  color: "var(--color-accent-2-800)",
};

export function soft(minHeight = 34): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight,
    padding: "0 14px",
    border: "1px solid var(--color-divider)",
    borderRadius: 999,
    background: "transparent",
    fontSize: 13,
    color: "var(--color-text)",
    cursor: "pointer",
  };
}

export function softOn(minHeight = 34): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight,
    padding: "0 14px",
    border: "1px solid transparent",
    borderRadius: 999,
    background: "var(--color-like-bg)",
    fontSize: 13,
    color: "var(--color-like-fg)",
    cursor: "pointer",
    fontWeight: 600,
  };
}

export const CHAT: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 10px",
  border: 0,
  borderRadius: "var(--radius-md)",
  background: "transparent",
  color: "var(--color-text)",
  cursor: "pointer",
};

export const CHAT_ON: CSSProperties = {
  ...CHAT,
  background: "var(--color-neutral-100)",
  boxShadow: "var(--shadow-sm)",
};

export function chatDotStyle(show: boolean): CSSProperties {
  return show
    ? { width: 8, height: 8, borderRadius: 999, background: "var(--color-accent)", flex: "none" }
    : { width: 8, height: 8, flex: "none" };
}

export function bubbleRowStyle(me: boolean): CSSProperties {
  return { display: "flex", justifyContent: me ? "flex-end" : "flex-start" };
}

export function bubbleStyle(me: boolean): CSSProperties {
  return {
    maxWidth: "74%",
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 14.5,
    lineHeight: 1.45,
    background: me ? "var(--color-accent)" : "var(--color-surface)",
    color: me ? "var(--color-neutral-100)" : "var(--color-text)",
    borderBottomRightRadius: me ? 6 : undefined,
    borderBottomLeftRadius: me ? undefined : 6,
  };
}

export function podiumCardStyle(rank: number): CSSProperties {
  const base: CSSProperties = {
    flex: "1 1 190px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    padding: 20,
    borderRadius: "var(--radius-lg)",
  };
  if (rank === 0) return { ...base, background: "var(--color-accent-200)", color: "var(--color-accent-900)" };
  if (rank === 1) return { ...base, background: "var(--color-accent-2-200)", color: "var(--color-accent-2-900)" };
  return { ...base, background: "var(--color-surface)", color: "var(--color-text)" };
}
