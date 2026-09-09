"use client";

import { useEffect, useRef, useState } from "react";
import { useHoverTooltip } from "@/lib/use-hover-tooltip";

export default function AnonToggleButton({
  anon,
  alias,
  onClick,
  action = "Publicar",
  size = 32,
}: {
  anon: boolean;
  alias: string;
  onClick: () => void;
  action?: string;
  size?: number;
}) {
  const { show, hide, portal } = useHoverTooltip();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovering, setHovering] = useState(false);
  const description = anon ? "Modo privado (publicas de forma anónima)" : `Modo público (publicas como ${alias})`;

  useEffect(() => {
    if (hovering && buttonRef.current) {
      show({ currentTarget: buttonRef.current }, description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, hovering]);

  function handleEnter(e: React.SyntheticEvent<HTMLButtonElement>) {
    setHovering(true);
    show(e, description);
  }

  function handleLeave() {
    setHovering(false);
    hide();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="chip-btn"
        onClick={onClick}
        aria-label={anon ? `${action} como ${alias}` : `${action} como anónimo`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        style={{
          display: "grid",
          placeItems: "center",
          width: size,
          height: size,
          flex: "none",
          borderRadius: 999,
          border: anon ? "1px solid transparent" : "1px solid var(--color-divider)",
          background: anon ? "var(--color-accent-200)" : "transparent",
          color: anon ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
          cursor: "pointer",
        }}
      >
        {anon ? (
          <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      {portal}
    </>
  );
}
