import type { CSSProperties } from "react";
import type { TextEffect } from "@/lib/types";

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

  if (effect === "rainbow") {
    return (
      <span className={className} style={baseStyle}>
        {[...text].map((ch, i) => (
          <span key={i} className="text-effect-shift" style={{ display: "inline-block", animationDelay: `${i * -0.12}s` }}>
            {ch}
          </span>
        ))}
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
