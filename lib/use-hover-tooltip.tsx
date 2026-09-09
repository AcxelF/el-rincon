"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
  text: string;
  top: number;
  left?: number;
  right?: number;
  below: boolean;
}

export function useHoverTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  function show(e: { currentTarget: HTMLElement }, text: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    const below = rect.top < 60;
    const top = below ? rect.bottom + 8 : rect.top - 8;
    const spaceRight = window.innerWidth - rect.left;
    if (spaceRight < 260) {
      setTooltip({ text, top, right: window.innerWidth - rect.right - 16, below });
    } else {
      setTooltip({ text, top, left: rect.left + 16, below });
    }
  }

  function hide() {
    setTooltip(null);
  }

  const portal =
    tooltip && typeof document !== "undefined"
      ? createPortal(
          <div
            key={tooltip.text}
            className={[
              "hover-tooltip",
              tooltip.right !== undefined ? "hover-tooltip-right" : "",
              tooltip.below ? "hover-tooltip-below" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ top: tooltip.top, left: tooltip.left, right: tooltip.right }}
          >
            {tooltip.text}
          </div>,
          document.body
        )
      : null;

  return { show, hide, portal };
}
