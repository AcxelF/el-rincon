"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { List } from "@phosphor-icons/react";
import type { AppNotification, View } from "@/lib/types";
import { TAB, TAB_ON } from "@/lib/style-helpers";
import { useHoverTooltip } from "@/lib/use-hover-tooltip";
import NotificationBell from "@/components/NotificationBell";

const TABS: [View, string][] = [["feed", "Inicio"]];

export default function Header({
  view,
  dark,
  anon,
  alias,
  myInitials,
  search,
  onSearchChange,
  onTabClick,
  onToggleTheme,
  onToggleAnon,
  onGoProfile,
  onGoFeed,
  isAdmin,
  reportsCount,
  isGuest = false,
  onRequireAuth,
  onOpenMobileNav,
  notifications,
  onOpenNotification,
  onMarkAllNotificationsRead,
}: {
  view: View;
  dark: boolean;
  anon: boolean;
  alias: string;
  myInitials: string;
  search: string;
  onSearchChange: (v: string) => void;
  onTabClick: (v: View) => void;
  onToggleTheme: () => void;
  onToggleAnon: () => void;
  onGoProfile: () => void;
  onGoFeed: () => void;
  isAdmin: boolean;
  reportsCount: number;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onOpenMobileNav: () => void;
  notifications: AppNotification[];
  onOpenNotification: (n: AppNotification) => void;
  onMarkAllNotificationsRead: () => void;
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchMounted, setMobileSearchMounted] = useState(false);
  const { show: showAnonTip, hide: hideAnonTip, portal: anonTipPortal } = useHoverTooltip();
  const anonButtonRef = useRef<HTMLButtonElement>(null);
  const [anonHovering, setAnonHovering] = useState(false);
  const anonDescription = anon ? "Modo privado (publicas de forma anónima)" : `Modo público (publicas como ${alias})`;

  useEffect(() => {
    if (anonHovering && anonButtonRef.current) {
      showAnonTip({ currentTarget: anonButtonRef.current }, anonDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anonDescription, anonHovering]);

  function handleAnonEnter(e: React.SyntheticEvent<HTMLButtonElement>) {
    setAnonHovering(true);
    showAnonTip(e, anonDescription);
  }

  function handleAnonLeave() {
    setAnonHovering(false);
    hideAnonTip();
  }

  function toggleMobileSearch() {
    if (mobileSearchMounted) {
      setMobileSearchOpen(false);
      setTimeout(() => setMobileSearchMounted(false), 200);
    } else {
      setMobileSearchMounted(true);
      setMobileSearchOpen(true);
    }
  }

  const themeButton = (className: string) => (
    <button className={`btn btn-secondary ${className}`} style={{ minHeight: 40, width: 40, padding: 0, fontSize: 15 }} onClick={onToggleTheme}>
      {dark ? "☀" : "☾"}
    </button>
  );

  const headerEl = (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        padding: "12px 26px",
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <button
        type="button"
        className="rail-toggle-btn btn btn-secondary"
        aria-label="Abrir menú de categorías"
        onClick={onOpenMobileNav}
        style={{ minHeight: 40, width: 40, padding: 0, fontSize: 17 }}
      >
        <List size={19} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onGoFeed}>
        <Image src="/logo.png" alt="El Rincón" width={40} height={40} priority style={{ width: 40, height: 40, objectFit: "contain" }} />
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 21, color: "var(--color-accent-700)" }}>El Rincón</div>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            Científica del Sur
          </div>
        </div>
      </div>

      {/* — desktop / tablet: inline nav, full search, theme + profile pill — */}
      <nav className="header-desktop-only" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {TABS.map(([key, name]) => {
          const active = view === key || (key === "feed" && view === "thread");
          return (
            <button key={key} className="chip-btn" style={active ? TAB_ON : TAB} onClick={() => onTabClick(key)}>
              {name}
            </button>
          );
        })}
        {isAdmin && (
          <button className="chip-btn" style={view === "admin" ? TAB_ON : TAB} onClick={() => onTabClick("admin")}>
            Admin{reportsCount > 0 ? ` (${reportsCount})` : ""}
          </button>
        )}
      </nav>

      <div className="header-desktop-only" style={{ flex: 1, minWidth: 150, maxWidth: 560, margin: "0 auto" }}>
        <input
          className="input"
          placeholder="Busca hilos, usuarios, quedadas…"
          style={{ minHeight: 40, paddingLeft: 16 }}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="header-desktop-only" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {themeButton("")}
        {isGuest ? (
          <button className="btn btn-primary" style={{ minHeight: 40 }} onClick={onRequireAuth}>
            Iniciar sesión
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell notifications={notifications} onOpenNotification={onOpenNotification} onMarkAllRead={onMarkAllNotificationsRead} />
            <button
              className="chip-btn"
              onClick={onGoProfile}
              aria-label="Ver perfil"
              style={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 999,
                border: view === "profile" ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)",
                cursor: "pointer",
                background: "var(--color-accent-300)",
                color: "var(--color-accent-900)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {myInitials}
            </button>
            <button
              ref={anonButtonRef}
              className="chip-btn"
              onClick={onToggleAnon}
              aria-label={anon ? `Publicar como ${alias}` : "Publicar como anónimo"}
              onMouseEnter={handleAnonEnter}
              onMouseLeave={handleAnonLeave}
              onFocus={handleAnonEnter}
              onBlur={handleAnonLeave}
              style={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 999,
                border: anon ? "1px solid transparent" : "1px solid var(--color-divider)",
                background: anon ? "var(--color-accent-200)" : "transparent",
                color: anon ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                cursor: "pointer",
              }}
            >
              {anon ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* — mobile: compact icon row — */}
      <div className="header-mobile-only" style={{ alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <button
          className="btn btn-secondary"
          aria-label="Buscar"
          style={{ minHeight: 36, width: 36, padding: 0, fontSize: 15 }}
          onClick={toggleMobileSearch}
        >
          🔍
        </button>
        {themeButton("")}
        {isGuest ? (
          <button className="btn btn-primary" style={{ minHeight: 36, fontSize: 13 }} onClick={onRequireAuth}>
            Entrar
          </button>
        ) : (
          <>
            <NotificationBell notifications={notifications} onOpenNotification={onOpenNotification} onMarkAllRead={onMarkAllNotificationsRead} size={36} />
            <button
              onClick={onGoProfile}
              aria-label="Ver perfil"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: 0,
                display: "grid",
                placeItems: "center",
                background: "var(--color-accent-300)",
                color: "var(--color-accent-900)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                outline: view === "profile" ? "2px solid var(--color-accent)" : "none",
                outlineOffset: 2,
              }}
            >
              {myInitials}
            </button>
          </>
        )}
      </div>

      {mobileSearchMounted && (
        <div className="header-search-reveal" data-closing={mobileSearchOpen ? undefined : "true"}>
          <div>
            <input
              className="input"
              autoFocus
              placeholder="Busca hilos, usuarios, quedadas…"
              style={{ minHeight: 40, paddingLeft: 16 }}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  );

  return (
    <>
      {headerEl}
      {anonTipPortal}
    </>
  );
}
