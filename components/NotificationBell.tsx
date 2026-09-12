"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChatCircle, Heart, ArrowFatUp, Flag } from "@phosphor-icons/react";
import type { AppNotification } from "@/lib/types";

const ICON_FOR: Record<AppNotification["type"], React.ReactNode> = {
  vote: <ArrowFatUp size={15} weight="fill" />,
  like: <Heart size={15} weight="fill" />,
  comment: <ChatCircle size={15} weight="fill" />,
  commentLike: <Heart size={15} weight="fill" />,
  report: <Flag size={15} weight="fill" />,
};

const TINT_FOR: Record<AppNotification["type"], string> = {
  vote: "var(--color-accent-700)",
  like: "var(--color-accent-2-700)",
  comment: "var(--color-brand-orange)",
  commentLike: "var(--color-accent-2-700)",
  report: "var(--color-accent-2-800)",
};

export default function NotificationBell({
  notifications,
  onOpenNotification,
  onMarkAllRead,
  className,
  size = 40,
}: {
  notifications: AppNotification[];
  onOpenNotification: (n: AppNotification) => void;
  onMarkAllRead: () => void;
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onMarkAllRead();
  }

  return (
    <div ref={ref} style={{ position: "relative" }} className={className}>
      <button
        className="chip-btn"
        onClick={toggle}
        aria-label="Notificaciones"
        style={{
          display: "grid",
          placeItems: "center",
          width: size,
          height: size,
          borderRadius: 999,
          border: "1px solid var(--color-divider)",
          background: "transparent",
          color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <Bell size={19} weight={unreadCount > 0 ? "fill" : "regular"} />
        {unreadCount > 0 && (
          <span
            className="notify-dot"
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              minWidth: 15,
              height: 15,
              padding: "0 3px",
              borderRadius: 999,
              background: "var(--color-brand-orange)",
              border: "2px solid var(--color-bg)",
              display: "grid",
              placeItems: "center",
              fontSize: 9.5,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="attach-menu notif-panel"
          style={{ top: "calc(100% + 10px)", right: 0, left: "auto", minWidth: 300, maxWidth: 340, padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-divider)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Notificaciones
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "26px 16px", textAlign: "center", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                Todavía no tienes notificaciones.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className="chip-btn"
                  onClick={() => {
                    onOpenNotification(n);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    width: "100%",
                    padding: "12px 16px",
                    border: 0,
                    borderBottom: "1px solid var(--color-divider)",
                    background: n.read ? "transparent" : "color-mix(in srgb, var(--color-accent) 8%, transparent)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ flex: "none", width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 999, background: "var(--color-neutral-100)", color: TINT_FOR[n.type] }}>
                    {ICON_FOR[n.type]}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, lineHeight: 1.4, color: "var(--color-text)" }}>{n.message}</span>
                    <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>{n.time}</span>
                  </span>
                  {!n.read && (
                    <span style={{ flex: "none", width: 8, height: 8, borderRadius: 999, background: "var(--color-brand-orange)", marginTop: 6 }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
