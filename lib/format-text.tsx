import type { ReactNode } from "react";

const FORMAT_REGEX = /\*\*([^\n]+?)\*\*|\*([^\n]+?)\*/g;

/** Renders **bold** and *italic* markers (added via the composer's N/K buttons) as real <strong>/<em>. */
export function renderFormattedText(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  FORMAT_REGEX.lastIndex = 0;
  while ((match = FORMAT_REGEX.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) parts.push(<strong key={key++}>{match[1]}</strong>);
    else parts.push(<em key={key++}>{match[2]}</em>);
    lastIndex = FORMAT_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/** For plain-text contexts (page <title>, meta tags) that can't render <strong>/<em>. */
export function stripFormatMarkers(text: string): string {
  return text.replace(/\*\*([^\n]+?)\*\*/g, "$1").replace(/\*([^\n]+?)\*/g, "$1");
}
