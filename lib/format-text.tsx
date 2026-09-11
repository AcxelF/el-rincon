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

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The inverse of renderFormattedText — used to seed the rich-text composer's contentEditable. */
export function markdownToHtml(text: string): string {
  let html = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  FORMAT_REGEX.lastIndex = 0;
  while ((match = FORMAT_REGEX.exec(text))) {
    if (match.index > lastIndex) html += escapeHtml(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) html += `<strong>${escapeHtml(match[1])}</strong>`;
    else html += `<em>${escapeHtml(match[2])}</em>`;
    lastIndex = FORMAT_REGEX.lastIndex;
  }
  if (lastIndex < text.length) html += escapeHtml(text.slice(lastIndex));
  return html.replace(/\n/g, "<br>");
}

/** Walks a contentEditable's DOM back into our bold/italic marker-based plain-text storage format. */
export function elementToMarkdown(root: HTMLElement): string {
  function isBoldEl(el: HTMLElement): boolean {
    const tag = el.tagName;
    if (tag === "B" || tag === "STRONG") return true;
    const weight = el.style.fontWeight;
    return weight === "bold" || weight === "700" || weight === "800" || weight === "900" || Number(weight) >= 600;
  }
  function isItalicEl(el: HTMLElement): boolean {
    const tag = el.tagName;
    return tag === "I" || tag === "EM" || el.style.fontStyle === "italic";
  }
  function walk(node: Node, bold: boolean, italic: boolean): string {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent ?? "";
      if (!text) return "";
      if (bold) text = `**${text}**`;
      if (italic) text = `*${text}*`;
      return text;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    if (el.tagName === "BR") return "\n";
    const nextBold = bold || isBoldEl(el);
    const nextItalic = italic || isItalicEl(el);
    let out = "";
    el.childNodes.forEach((child) => {
      out += walk(child, nextBold, nextItalic);
    });
    return out;
  }

  let result = "";
  let sawBlock = false;
  root.childNodes.forEach((child) => {
    const isBlock = child.nodeType === Node.ELEMENT_NODE && ["DIV", "P"].includes((child as HTMLElement).tagName);
    if (isBlock && sawBlock) result += "\n";
    result += walk(child, false, false);
    if (isBlock) sawBlock = true;
  });
  return result.replace(/\n+$/, "");
}
