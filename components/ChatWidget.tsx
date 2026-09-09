"use client";

import { useEffect, useRef } from "react";
import type { Chat, ChatMessage } from "@/lib/types";
import { avatarForAlias, bubbleRowStyle, bubbleStyle, chatDotStyle, initials } from "@/lib/style-helpers";
import Badge from "@/components/Badge";

export default function ChatWidget({
  open,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  dmDraft,
  onDmDraftChange,
  onDmKey,
  onSendDm,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId: number;
  onSelectChat: (id: number) => void;
  dmDraft: string;
  onDmDraftChange: (v: string) => void;
  onDmKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendDm: () => void;
  badges: Record<string, string>;
}) {
  const chat = chats.find((c) => c.id === activeChatId) || chats[0];
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    msgsEndRef.current?.scrollIntoView({ block: "end" });
  }, [open, chat?.id, chat?.msgs.length]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--floating-offset)",
        right: 20,
        width: 340,
        maxWidth: "calc(100vw - 40px)",
        height: 460,
        maxHeight: "calc(100vh - var(--floating-offset) - 20px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-neutral-100)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-divider)",
          background: "var(--color-surface)",
        }}
      >
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, flex: 1 }}>Mensajes</span>
        <button className="btn btn-ghost" style={{ minHeight: 28, width: 28, padding: 0, fontSize: 14 }} onClick={onClose}>
          ✕
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 12px",
          overflowX: "auto",
          borderBottom: "1px solid var(--color-divider)",
          flex: "none",
        }}
      >
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectChat(c.id)}
            className="icon-btn"
            style={{
              position: "relative",
              flex: "none",
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              opacity: c.id === activeChatId ? 1 : 0.55,
            }}
            title={c.alias}
          >
            <div style={avatarForAlias(c.alias, 34)}>{initials(c.alias)}</div>
            <span
              className={c.unread && c.id !== activeChatId ? "notify-dot" : undefined}
              style={{ ...chatDotStyle(c.unread && c.id !== activeChatId), position: "absolute", top: -1, right: -1 }}
            />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--color-divider)" }}>
        <div style={avatarForAlias(chat.alias, 32)}>{initials(chat.alias)}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {chat.alias}
            <Badge label={badges[chat.alias]} />
          </div>
          <div style={{ fontSize: 11, color: "var(--color-accent-2-700)" }}>{chat.status}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 14, overflowY: "auto" }}>
        {chat.msgs.map((m: ChatMessage, i: number) => (
          <div key={i} className="list-item-enter" style={bubbleRowStyle(m.me)}>
            <div style={bubbleStyle(m.me)}>{m.text}</div>
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--color-divider)" }}>
        <input
          className="input"
          placeholder="Escribe algo…"
          style={{ minHeight: 38, paddingLeft: 14, background: "var(--color-surface)" }}
          value={dmDraft}
          onChange={(e) => onDmDraftChange(e.target.value)}
          onKeyDown={onDmKey}
        />
        <button className="btn btn-primary" style={{ minHeight: 38 }} onClick={onSendDm}>
          Enviar
        </button>
      </div>
    </div>
  );
}
