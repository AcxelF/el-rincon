"use client";

import { useState } from "react";
import type { DecoratedPost } from "@/lib/types";
import { formatKarma } from "@/lib/mock-data";
import Badge from "@/components/Badge";
import AdminUserActions from "@/components/AdminUserActions";
import FollowButton from "@/components/FollowButton";

export default function ProfileView({
  mine,
  onOpenPost,
  alias,
  myInitials,
  isSelf,
  isAdmin,
  onSaveAlias,
  onSaveBio,
  onLogout,
  onBack,
  onMessage,
  onToast,
  onBadgeChanged,
  badge,
  bio,
  followers,
  following,
  isFollowing,
  onToggleFollow,
  karma,
  commentCount,
  rank,
}: {
  mine: DecoratedPost[];
  onOpenPost: (id: number) => void;
  alias: string;
  myInitials: string;
  isSelf: boolean;
  isAdmin: boolean;
  onSaveAlias: (next: string) => Promise<string | undefined>;
  onSaveBio: (next: string) => Promise<string | undefined>;
  onLogout: () => void;
  onBack: () => void;
  onMessage: () => void;
  onToast: (message: string) => void;
  onBadgeChanged: () => void;
  badge?: string;
  bio?: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  onToggleFollow: () => Promise<void>;
  karma: number;
  commentCount: number;
  rank: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draftAlias, setDraftAlias] = useState(alias);
  const [aliasError, setAliasError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState(bio ?? "");
  const [bioError, setBioError] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  function startEditing() {
    setDraftAlias(alias);
    setAliasError("");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const error = await onSaveAlias(draftAlias);
    setSaving(false);
    if (error) {
      setAliasError(error);
      return;
    }
    setEditing(false);
  }

  function startEditingBio() {
    setDraftBio(bio ?? "");
    setBioError("");
    setEditingBio(true);
  }

  async function saveBioDraft() {
    setSavingBio(true);
    const error = await onSaveBio(draftBio);
    setSavingBio(false);
    if (error) {
      setBioError(error);
      return;
    }
    setEditingBio(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!isSelf && (
        <button className="btn btn-ghost" style={{ alignSelf: "flex-start", fontSize: 14 }} onClick={onBack}>
          ← Volver al rincón
        </button>
      )}

      <div style={{ padding: "26px 28px", borderRadius: "var(--radius-lg)", background: "var(--color-accent-200)", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            width: 84,
            height: 84,
            flex: "none",
            borderRadius: 999,
            background: "var(--color-accent-400)",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 30,
            color: "var(--color-accent-900)",
          }}
        >
          {myInitials}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="input"
                  autoFocus
                  value={draftAlias}
                  onChange={(e) => setDraftAlias(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  style={{ maxWidth: 240, fontSize: 18, background: "var(--color-neutral-100)" }}
                />
                <button className="btn btn-primary" style={{ minHeight: 36 }} onClick={save} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button className="btn btn-secondary" style={{ minHeight: 36 }} onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
              {aliasError && <div style={{ fontSize: 12.5, color: "var(--color-accent-2-800)", marginTop: 6 }}>{aliasError}</div>}
            </div>
          ) : (
            <h1 style={{ margin: "0 0 4px", fontSize: 30, lineHeight: 1.1, color: "var(--color-accent-900)", display: "flex", alignItems: "center", gap: 10 }}>
              {alias}
              <Badge label={badge} />
            </h1>
          )}
          <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-accent-900) 70%, transparent)" }}>
            <strong>{followers}</strong> {followers === 1 ? "seguidor" : "seguidores"} · <strong>{following}</strong> siguiendo
          </div>
          {editingBio ? (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
              <textarea
                className="input"
                autoFocus
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                maxLength={160}
                placeholder="Cuenta algo de ti…"
                style={{ minHeight: 64, fontSize: 14, background: "var(--color-neutral-100)" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn btn-primary" style={{ minHeight: 32, fontSize: 13 }} onClick={saveBioDraft} disabled={savingBio}>
                  {savingBio ? "Guardando…" : "Guardar"}
                </button>
                <button className="btn btn-secondary" style={{ minHeight: 32, fontSize: 13 }} onClick={() => setEditingBio(false)}>
                  Cancelar
                </button>
                <span style={{ fontSize: 11, color: "var(--color-accent-800)" }}>{draftBio.length}/160</span>
              </div>
              {bioError && <div style={{ fontSize: 12.5, color: "var(--color-accent-2-800)" }}>{bioError}</div>}
            </div>
          ) : (
            <>
              {bio && (
                <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5, maxWidth: "52ch", color: "var(--color-accent-900)" }}>{bio}</p>
              )}
              {isSelf && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12.5, minHeight: "auto", padding: 0, marginTop: bio ? 6 : 8, color: "var(--color-accent-800)" }}
                  onClick={startEditingBio}
                >
                  {bio ? "Editar descripción" : "+ Agregar una descripción"}
                </button>
              )}
            </>
          )}
        </div>
        {!editing && (
          <div style={{ display: "flex", gap: 8 }}>
            {isSelf ? (
              <>
                <button className="btn btn-secondary" onClick={startEditing}>
                  Editar alias
                </button>
                <button className="btn btn-secondary" onClick={onLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <FollowButton isFollowing={isFollowing} onToggle={onToggleFollow} />
                <button className="btn btn-secondary" onClick={onMessage}>
                  💬 Mensaje
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isAdmin && !isSelf && <AdminUserActions alias={alias} onToast={onToast} onBadgeChanged={onBadgeChanged} />}

      {isSelf && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { value: formatKarma(karma), label: "Karma del rincón" },
            { value: String(mine.length), label: "Hilos abiertos" },
            { value: String(commentCount), label: "Comentarios" },
            { value: rank > 0 ? `#${rank}` : "—", label: "En el ranking" },
          ].map((s) => (
            <div key={s.label} style={{ flex: "1 1 140px", padding: "16px 18px", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1, color: "var(--color-accent-700)" }}>{s.value}</div>
              <div style={{ fontSize: 12.5, marginTop: 5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 55%, transparent)", margin: "6px 0 10px" }}>
          {isSelf ? "Sus hilos" : `Hilos de ${alias}`}
        </div>
        {mine.length === 0 && (
          <div style={{ padding: "20px 22px", textAlign: "center", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            {isSelf ? "Todavía no publicas nada." : "Todavía no ha publicado nada."}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mine.map((p) => (
            <div
              key={p.id}
              style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}
              onClick={() => onOpenPost(p.id)}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 17, color: "var(--color-accent-700)", width: 44 }}>{p.votes}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                  {p.cat} · {p.commentCount} comentarios
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
