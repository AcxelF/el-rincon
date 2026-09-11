import type { CSSProperties } from "react";
import type { TextEffect } from "@/lib/types";

/** Effects that animate letter-by-letter: each character gets its own span with a staggered
 * negative animation-delay, so the animation reads as a wave traveling across the text instead
 * of the whole word moving as one block. */
const LETTER_EFFECT_CLASS: Partial<Record<TextEffect, string>> = {
  rainbow: "text-effect-shift",
  wavy: "text-effect-wavy",
  jump: "text-effect-jump",
  spin: "text-effect-spin",
};

export default function NameText({
  text,
  color,
  effect,
  className,
  style,
}: {
  text: string;
  color?: string | null;
  effect?: TextEffect | null;
  className?: string;
  style?: CSSProperties;
}) {
  const baseStyle: CSSProperties = { ...style, ...(color ? { color } : {}) };

  const letterClass = effect ? LETTER_EFFECT_CLASS[effect] : undefined;
  if (letterClass) {
    return (
      <span className={className} style={baseStyle}>
        {[...text].map((ch, i) => (
          <span key={i} className={letterClass} style={{ display: "inline-block", animationDelay: `${i * -0.12}s` }}>
            {ch}
          </span>
        ))}
      </span>
    );
  }

  if (effect === "gradient") {
    const base = color || "currentColor";
    return (
      <span
        className={className}
        style={{
          ...style,
          background: `linear-gradient(90deg, ${base}, color-mix(in srgb, ${base} 25%, white))`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {text}
      </span>
    );
  }

  const effectClass = effect ? `text-effect-${effect}` : "";
  return (
    <span className={[className, effectClass].filter(Boolean).join(" ")} style={baseStyle}>
      {text}
    </span>
  );
}
