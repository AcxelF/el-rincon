"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import type { BadgeInfo, Chat, ChatMessage } from "@/lib/types";
import { avatarForAlias, bubbleRowStyle, bubbleStyle, chatDotStyle, initials } from "@/lib/style-helpers";
import Badge from "@/components/Badge";

export default function ChatWidget({
  open,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onStartChat,
  dmDraft,
  onDmDraftChange,
  onDmKey,
  onSendDm,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onStartChat: (alias: string) => void;
  dmDraft: string;
  onDmDraftChange: (v: string) => void;
  onDmKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendDm: () => void;
  badges: Record<string, BadgeInfo>;
}) {
  const chat = chats.find((c) => c.id === activeChatId) || chats[0];
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ alias: string; badge: string | null }[]>([]);

  const [rendered, setRendered] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setRendered(true);
  }

  useEffect(() => {
    if (open) return;
    const timeout = setTimeout(() => setRendered(false), 220);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    msgsEndRef.current?.scrollIntoView({ block: "end" });
  }, [open, chat?.id, chat?.msgs.length]);

  useEffect(() => {
    if (!searchOpen) return;
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setResults(data.users || []);
        })
        .catch(() => {
          // keep whatever results we already have
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, searchOpen]);

  function openSearch() {
    setSearchOpen(true);
    setQuery("");
    setResults([]);
  }

  function pickResult(alias: string) {
    setSearchOpen(false);
    onStartChat(alias);
  }

  if (!rendered) return null;

  return (
    <div
      className="chat-panel"
      data-state={open ? "open" : "closing"}
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
        border: "1px solid var(--color-divider)",
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
        {searchOpen && (
          <button
            className="btn btn-ghost"
            style={{ minHeight: 28, width: 28, padding: 0, display: "grid", placeItems: "center" }}
            onClick={() => setSearchOpen(false)}
            aria-label="Volver a mensajes"
            title="Volver"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, flex: 1 }}>{searchOpen ? "Nueva conversación" : "Mensajes"}</span>
        {!searchOpen && (
          <button
            className="btn btn-ghost"
            style={{ minHeight: 28, width: 28, padding: 0, display: "grid", placeItems: "center" }}
            onClick={openSearch}
            aria-label="Nueva conversación"
            title="Nueva conversación"
          >
            <Plus size={15} weight="bold" />
          </button>
        )}
        <button className="btn btn-ghost" style={{ minHeight: 28, width: 28, padding: 0, fontSize: 14 }} onClick={onClose}>
          ✕
        </button>
      </div>

      {searchOpen ? (
        <>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-divider)" }}>
            <div style={{ position: "relative" }}>
              <MagnifyingGlass
                size={15}
                style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none" }}
              />
              <input
                autoFocus
                className="input"
                placeholder="Busca a alguien por su nombre de usuario…"
                style={{ minHeight: 38, paddingLeft: 34, background: "var(--color-surface)" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {query.trim() && results.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  fontSize: 13,
                  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                }}
              >
                No encontramos a nadie con ese nombre.
              </div>
            )}
            {(query.trim() ? results : []).map((u) => (
              <button
                key={u.alias}
                className="chip-btn"
                onClick={() => pickResult(u.alias)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: 0,
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={avatarForAlias(u.alias, 32)}>{initials(u.alias)}</div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{u.alias}</span>
                <Badge label={u.badge ?? undefined} />
              </button>
            ))}
          </div>
        </>
      ) : !chat ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            fontSize: 13.5,
            lineHeight: 1.5,
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          Todavía no tienes mensajes. Toca el{" "}
          <Plus size={12} weight="bold" style={{ display: "inline", verticalAlign: "middle" }} /> de arriba para buscar a alguien y empezar una
          conversación.
        </div>
      ) : (
        <>
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
                <span className={badges[chat.alias]?.nameEffect ? `text-effect-${badges[chat.alias]?.nameEffect}` : ""}>{chat.alias}</span>
                <Badge
                  label={badges[chat.alias]?.label}
                  color={badges[chat.alias]?.color}
                  textColor={badges[chat.alias]?.textColor}
                  effect={badges[chat.alias]?.effect}
                />
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

          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--color-divider)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="Escribe algo…"
                style={{ minHeight: 38, paddingLeft: 14, background: "var(--color-surface)" }}
                value={dmDraft}
                onChange={(e) => onDmDraftChange(e.target.value)}
                onKeyDown={onDmKey}
                maxLength={1000}
              />
              <button className="btn btn-primary" style={{ minHeight: 38 }} onClick={onSendDm}>
                Enviar
              </button>
            </div>
            <div style={{ textAlign: "right", fontSize: 10.5, marginTop: 4, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
              {dmDraft.length}/1000
            </div>
          </div>
        </>
      )}
    </div>
  );
}
