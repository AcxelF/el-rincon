"use client";

import { useEffect, useState } from "react";
import type { Category, Report } from "@/lib/types";
import { BADGE_PRESETS, iconForBadge } from "@/lib/badges";
import { DURATIONS, formatUntil } from "@/lib/durations";

type Tab = "reports" | "channels" | "users";

interface AdminUser {
  id: string;
  alias: string;
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  bannedUntil: number | null;
  mutedUntil: number | null;
  badge: string | null;
  createdAt: string;
}

function formatJoinDate(createdAt: string): string {
  const [datePart] = createdAt.split(" ");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return createdAt;
  return `${d}/${m}/${y}`;
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
};

const cardStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-neutral-100)",
  boxShadow: "var(--shadow-sm)",
};

export default function AdminView({
  reports,
  onDismissReport,
  onOpenReport,
  onDeletePost,
  onDeleteComment,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  currentAlias,
  onBadgeChanged,
  onMessageUser,
  onViewProfile,
  onToast,
}: {
  reports: Report[];
  onDismissReport: (id: number) => void;
  onOpenReport: (postId: number) => void;
  onDeletePost: (id: number) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
  categories: Category[];
  onAddCategory: (name: string, emoji: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  currentAlias: string;
  onBadgeChanged: () => void;
  onMessageUser: (alias: string) => void;
  onViewProfile: (alias: string) => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("reports");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 29, margin: 0, lineHeight: 1.1 }}>Admin</h1>

      <div style={{ display: "flex", gap: 6 }}>
        {(
          [
            ["reports", `Reportes${reports.length ? ` (${reports.length})` : ""}`],
            ["channels", "Canales"],
            ["users", "Usuarios"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: tab === key ? "1px solid transparent" : "1px solid var(--color-divider)",
              background: tab === key ? "var(--color-accent)" : "transparent",
              color: tab === key ? "var(--color-neutral-100)" : "var(--color-text)",
              font: "inherit",
              fontSize: 13.5,
              fontWeight: tab === key ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportsTab reports={reports} onDismiss={onDismissReport} onOpen={onOpenReport} onDeletePost={onDeletePost} onDeleteComment={onDeleteComment} />}
      {tab === "channels" && <ChannelsTab categories={categories} onAdd={onAddCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} />}
      {tab === "users" && (
        <UsersTab currentAlias={currentAlias} onBadgeChanged={onBadgeChanged} onMessageUser={onMessageUser} onViewProfile={onViewProfile} onToast={onToast} />
      )}
    </div>
  );
}

function ReportsTab({
  reports,
  onDismiss,
  onOpen,
  onDeletePost,
  onDeleteComment,
}: {
  reports: Report[];
  onDismiss: (id: number) => void;
  onOpen: (postId: number) => void;
  onDeletePost: (id: number) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
}) {
  if (reports.length === 0) {
    return <div style={{ ...cardStyle, textAlign: "center", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>No hay nada reportado. Todo tranquilo por ahora.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reports.map((r) => (
        <div key={r.id} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 58%, transparent)" }}>
            <span className="tag tag-accent-2">{r.kind === "post" ? "Post" : "Comentario"}</span>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{r.author}</span>
            <span>
              · en &quot;{r.postTitle}&quot;
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{r.snippet}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} onClick={() => onOpen(r.postId)}>
              Ver hilo
            </button>
            <button
              className="btn btn-secondary"
              style={{ minHeight: 32, fontSize: 12.5, color: "var(--color-accent-2-700)" }}
              onClick={() => (r.kind === "post" ? onDeletePost(r.postId) : onDeleteComment(r.postId, r.commentId!))}
            >
              🗑 Eliminar contenido
            </button>
            <button className="btn btn-ghost" style={{ minHeight: 32, fontSize: 12.5 }} onClick={() => onDismiss(r.id)}>
              Descartar reporte
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChannelsTab({
  categories,
  onAdd,
  onRename,
  onDelete,
}: {
  categories: Category[];
  onAdd: (name: string, emoji: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  const editable = categories.filter((c) => c.id !== "all");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {editable.map((c) => (
          <div key={c.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
            <span style={{ fontSize: 18 }}>{c.emoji}</span>
            {editingId === c.id ? (
              <>
                <input
                  className="input"
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  style={{ flex: 1, minHeight: 34, background: "var(--color-surface)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRename(c.id, draftName);
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ minHeight: 34, fontSize: 12.5 }}
                  onClick={() => {
                    onRename(c.id, draftName);
                    setEditingId(null);
                  }}
                >
                  Guardar
                </button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 14.5 }}>{c.name}</span>
                <button
                  className="btn btn-secondary"
                  style={{ minHeight: 32, fontSize: 12.5 }}
                  onClick={() => {
                    setEditingId(c.id);
                    setDraftName(c.name);
                  }}
                >
                  Renombrar
                </button>
                <button className="btn btn-ghost" style={{ minHeight: 32, fontSize: 12.5, color: "var(--color-accent-2-700)" }} onClick={() => onDelete(c.id)}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={sectionLabel}>Nuevo canal</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Emoji"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            style={{ width: 70, minHeight: 36, textAlign: "center", background: "var(--color-surface)" }}
          />
          <input
            className="input"
            placeholder="Nombre del canal"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, minWidth: 160, minHeight: 36, background: "var(--color-surface)" }}
          />
          <button
            className="btn btn-primary"
            style={{ minHeight: 36 }}
            onClick={() => {
              onAdd(newName, newEmoji);
              setNewName("");
              setNewEmoji("");
            }}
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersTab({
  currentAlias,
  onBadgeChanged,
  onMessageUser,
  onViewProfile,
  onToast,
}: {
  currentAlias: string;
  onBadgeChanged: () => void;
  onMessageUser: (alias: string) => void;
  onViewProfile: (alias: string) => void;
  onToast: (message: string) => void;
}) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [busyAlias, setBusyAlias] = useState<string | null>(null);
  const [badgeDrafts, setBadgeDrafts] = useState<Record<string, string>>({});
  const [durationDrafts, setDurationDrafts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");

  function refresh() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const list: AdminUser[] = data.users || [];
        setUsers(list);
        setBadgeDrafts((prev) => {
          const next = { ...prev };
          for (const u of list) if (!(u.alias in next)) next[u.alias] = u.badge || "";
          return next;
        });
      })
      .catch(() => setError("No se pudo cargar la lista de usuarios."));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function runAction(alias: string, path: string, body: Record<string, unknown>, onOk?: () => void) {
    setBusyAlias(alias);
    setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar.");
        return;
      }
      refresh();
      onOk?.();
    } finally {
      setBusyAlias(null);
    }
  }

  function durationLabel(alias: string): string {
    return DURATIONS[durationDrafts[alias] ?? 0].label;
  }

  const toggleBan = (alias: string, banned: boolean) => {
    const ms = banned ? DURATIONS[durationDrafts[alias] ?? 0].ms : undefined;
    runAction(alias, "/api/admin/ban", { alias, banned, durationMs: ms }, () =>
      onToast(banned ? `${alias} fue baneado${ms ? ` por ${durationLabel(alias).toLowerCase()}` : ""}` : `${alias} fue desbaneado`)
    );
  };
  const toggleMute = (alias: string, muted: boolean) => {
    const ms = muted ? DURATIONS[durationDrafts[alias] ?? 0].ms : undefined;
    runAction(alias, "/api/admin/mute", { alias, muted, durationMs: ms }, () =>
      onToast(muted ? `${alias} fue silenciado${ms ? ` por ${durationLabel(alias).toLowerCase()}` : ""}` : `Se reactivó la voz de ${alias}`)
    );
  };
  const saveBadge = (alias: string) =>
    runAction(alias, "/api/admin/badge", { alias, badge: badgeDrafts[alias] || "" }, () => {
      onBadgeChanged();
      onToast(badgeDrafts[alias] ? `Insignia actualizada para ${alias}` : `Insignia removida de ${alias}`);
    });

  if (!users) return <div style={{ ...cardStyle }}>Cargando…</div>;

  const filtered = query.trim() ? users.filter((u) => u.alias.toLowerCase().includes(query.trim().toLowerCase())) : users;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        className="input"
        placeholder="Buscar usuario por nombre de usuario…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ minHeight: 38, background: "var(--color-surface)" }}
      />

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      {filtered.length === 0 && (
        <div style={{ ...cardStyle, textAlign: "center", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
          No hay usuarios que coincidan con esa búsqueda.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((u) => (
          <div key={u.id} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="alias-link" style={{ fontSize: 14.5, fontWeight: 600 }} onClick={() => onViewProfile(u.alias)}>
                {u.alias}
              </span>
              {u.isAdmin && <span className="tag tag-accent">Admin</span>}
              {u.isBanned && <span className="tag tag-accent-2">Baneado{u.bannedUntil ? ` hasta ${formatUntil(u.bannedUntil)}` : ""}</span>}
              {u.isMuted && <span className="tag tag-accent-2">Silenciado{u.mutedUntil ? ` hasta ${formatUntil(u.mutedUntil)}` : ""}</span>}
              {u.badge && (
                <span className="tag tag-accent">
                  {iconForBadge(u.badge)} {u.badge}
                </span>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>Se unió: {formatJoinDate(u.createdAt)}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {BADGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="btn btn-ghost"
                  style={{ minHeight: 28, fontSize: 12 }}
                  onClick={() => setBadgeDrafts((d) => ({ ...d, [u.alias]: preset.label }))}
                >
                  {preset.icon} {preset.label}
                </button>
              ))}
              <input
                className="input"
                placeholder="Insignia / rango personalizado"
                value={badgeDrafts[u.alias] ?? ""}
                onChange={(e) => setBadgeDrafts((d) => ({ ...d, [u.alias]: e.target.value }))}
                style={{ width: 190, minHeight: 32, fontSize: 12.5, background: "var(--color-surface)" }}
              />
              <button className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} disabled={busyAlias === u.alias} onClick={() => saveBadge(u.alias)}>
                Guardar insignia
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-secondary" style={{ minHeight: 32, fontSize: 12.5 }} onClick={() => onMessageUser(u.alias)}>
                💬 Mensaje
              </button>
              {u.alias !== currentAlias && (
                <>
                  {!(u.isMuted && u.isBanned) && (
                    <select
                      className="input"
                      value={durationDrafts[u.alias] ?? 0}
                      onChange={(e) => setDurationDrafts((d) => ({ ...d, [u.alias]: Number(e.target.value) }))}
                      style={{ width: 120, minHeight: 32, fontSize: 12.5, background: "var(--color-surface)" }}
                    >
                      {DURATIONS.map((d, i) => (
                        <option key={d.label} value={i}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    className="btn btn-secondary"
                    style={{ minHeight: 32, fontSize: 12.5, color: u.isMuted ? undefined : "var(--color-accent-2-700)" }}
                    disabled={busyAlias === u.alias}
                    onClick={() => toggleMute(u.alias, !u.isMuted)}
                  >
                    {u.isMuted ? "Reactivar voz" : "Silenciar"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ minHeight: 32, fontSize: 12.5, color: u.isBanned ? undefined : "var(--color-accent-2-700)" }}
                    disabled={busyAlias === u.alias}
                    onClick={() => toggleBan(u.alias, !u.isBanned)}
                  >
                    {u.isBanned ? "Desbanear" : "Banear"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
