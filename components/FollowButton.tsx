"use client";

import { useState } from "react";

export default function FollowButton({
  isFollowing,
  onToggle,
  compact = false,
}: {
  isFollowing: boolean;
  onToggle: () => void | Promise<void>;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await onToggle();
    setBusy(false);
  }

  return (
    <button
      type="button"
      className="chip-btn"
      onClick={handleClick}
      disabled={busy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        minHeight: compact ? 26 : 36,
        padding: compact ? "0 10px" : "0 16px",
        borderRadius: 999,
        fontSize: compact ? 11.5 : 13.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        border: isFollowing ? "1px solid var(--color-divider)" : "1px solid transparent",
        background: isFollowing ? "transparent" : "var(--color-accent)",
        color: isFollowing ? "color-mix(in srgb, var(--color-text) 65%, transparent)" : "var(--color-neutral-100)",
        transition: "background 180ms var(--ease-out), border-color 180ms var(--ease-out), color 180ms var(--ease-out)",
      }}
    >
      {isFollowing && (
        <span key="on" className="heart-pop" style={{ display: "inline-block" }}>
          ✓
        </span>
      )}
      {isFollowing ? "Siguiendo" : "+ Seguir"}
    </button>
  );
}
