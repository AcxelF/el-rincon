"use client";

import { useRef, useState } from "react";
import type { BadgeInfo, DecoratedComment, DecoratedPost } from "@/lib/types";
import { ARROW, ARROW_DOWN, ARROW_UP, avatarForAlias, avatarStyle, initials, soft, softOn } from "@/lib/style-helpers";
import { renderFormattedText, stripFormatMarkers } from "@/lib/format-text";
import Badge from "@/components/Badge";
import NameText from "@/components/NameText";
import Poll from "@/components/Poll";
import FollowButton from "@/components/FollowButton";
import AnonToggleButton from "@/components/AnonToggleButton";
import ImageLightbox from "@/components/ImageLightbox";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ThreadView({
  post,
  comments,
  reply,
  onReplyChange,
  onSendReply,
  postAsLabel,
  isGuest,
  anon,
  onToggleAnon,
  onBack,
  onVote,
  onToggleLike,
  onToggleCommentLike,
  onVotePoll,
  myInitials,
  isAdmin,
  onDeletePost,
  onEditPost,
  onDeleteComment,
  onTogglePin,
  onReportPost,
  onReportComment,
  onViewProfile,
  badges,
  isMuted,
  myAlias,
  followingSet,
  onToggleFollow,
  onMarkBestAnswer,
}: {
  post: DecoratedPost;
  comments: DecoratedComment[];
  reply: string;
  onReplyChange: (v: string) => void;
  onSendReply: () => void;
  postAsLabel: string;
  isGuest: boolean;
  anon: boolean;
  onToggleAnon: () => void;
  onBack: () => void;
  onVote: (dir: 1 | -1) => void;
  onToggleLike: () => void;
  onToggleCommentLike: (id: number) => void;
  onVotePoll: (optionId: number) => void;
  myInitials: string;
  isAdmin: boolean;
  onDeletePost: () => void;
  onEditPost: (opts: { title: string; text: string }) => Promise<string | undefined>;
  onDeleteComment: (id: number) => void;
  onTogglePin: () => void;
  onReportPost: () => void;
  onReportComment: (id: number) => void;
  onViewProfile: (alias: string) => void;
  badges: Record<string, BadgeInfo>;
  isMuted: boolean;
  myAlias: string;
  followingSet: Set<string>;
  onToggleFollow: (alias: string) => void;
  onMarkBestAnswer: (commentId: number) => void;
}) {
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editText, setEditText] = useState(post.body);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const canPickBestAnswer = post.isQuestion && (isAdmin || post.author === myAlias);

  function replyToComment(author: string) {
    const mention = `${author} `;
    onReplyChange(reply.startsWith(mention) ? reply : mention + reply);
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startEdit() {
    setEditTitle(post.title);
    setEditText(post.body);
    setEditError("");
    setEditing(true);
  }

  async function saveEdit() {
    setEditSaving(true);
    setEditError("");
    const err = await onEditPost({ title: editTitle, text: editText });
    setEditSaving(false);
    if (err) {
      setEditError(err);
      return;
    }
    setEditing(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ fontSize: 14 }} onClick={onBack}>
          ← Volver al rincón
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {isAdmin && (
            <button className="btn btn-ghost" style={{ fontSize: 14 }} onClick={onTogglePin}>
              {post.pinned ? "📌 Quitar" : "📌 Fijar"}
            </button>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 14 }} disabled={post.reported} onClick={onReportPost}>
            {post.reported ? "🚩 Reportado" : "🚩 Reportar"}
          </button>
          {post.isMine && !editing && (
            <button className="btn btn-ghost" style={{ fontSize: 14 }} onClick={startEdit}>
              ✏️ Editar
            </button>
          )}
          {(isAdmin || post.isMine) && (
            <button className="btn btn-ghost" style={{ fontSize: 14, color: "var(--color-accent-2-700)" }} onClick={() => setConfirmingDelete(true)}>
              {post.isMine ? "🗑 Eliminar hilo" : "🗑 Eliminar hilo (admin)"}
            </button>
          )}
        </div>
      </div>

      <article
        style={{
          padding: "26px 28px",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-neutral-100)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 58%, transparent)" }}>
          {post.pinned && <span className="tag tag-accent">📌 Fijado</span>}
          {post.isQuestion && <span className="tag tag-accent">❓ Pregunta</span>}
          {post.isQuestion && post.bestAnswerId != null && <span className="tag tag-accent-2">✓ Resuelta</span>}
          <span className="tag tag-accent-2">{post.cat}</span>
          <span className="alias-link" style={{ fontWeight: 600, color: "var(--color-text)" }} onClick={() => onViewProfile(post.author)}>
            <NameText text={post.author} color={badges[post.author]?.nameColor} effect={badges[post.author]?.nameEffect} />
          </span>
          <Badge
            label={badges[post.author]?.label}
            color={badges[post.author]?.color}
            textColor={badges[post.author]?.textColor}
            effect={badges[post.author]?.effect}
          />
          {post.author !== myAlias && (
            <FollowButton compact isFollowing={followingSet.has(post.author)} onToggle={() => onToggleFollow(post.author)} />
          )}
          <span>· {post.time}</span>
        </div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className="input"
              placeholder="Título (opcional)"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ fontSize: 18, fontWeight: 600 }}
              maxLength={120}
            />
            <textarea
              className="input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{ fontSize: 15, minHeight: 120, resize: "vertical" }}
              maxLength={2000}
            />
            {editError && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{editError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" disabled={editSaving || !editText.trim()} onClick={saveEdit}>
                {editSaving ? "Guardando…" : "Guardar"}
              </button>
              <button className="btn btn-secondary" disabled={editSaving} onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.12 }}>
              {stripFormatMarkers(post.title)}
              {post.edited && (
                <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 10, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
                  (editado)
                </span>
              )}
            </h1>
            {post.body !== post.title && (
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, maxWidth: "62ch", color: "color-mix(in srgb, var(--color-text) 82%, transparent)" }}>
                {renderFormattedText(post.body)}
              </p>
            )}
          </>
        )}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt=""
            onClick={() => setLightboxUrl(post.imageUrl)}
            style={{ width: "100%", maxHeight: 560, objectFit: "cover", borderRadius: "var(--radius-lg)", display: "block", cursor: "pointer" }}
          />
        )}
        {post.poll && (
          <div style={{ maxWidth: 420 }}>
            <Poll poll={post.poll} onVote={onVotePoll} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 999, background: "var(--color-surface)" }}>
            <button className="icon-btn" style={post.voteValue === 1 ? ARROW_UP : ARROW} onClick={() => onVote(1)}>
              ▲
            </button>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{post.votes}</span>
            <button className="icon-btn" style={post.voteValue === -1 ? ARROW_DOWN : ARROW} onClick={() => onVote(-1)}>
              ▼
            </button>
          </div>
          <button className="chip-btn" style={post.liked ? softOn() : soft()} onClick={onToggleLike}>
            <span key={post.liked ? "on" : "off"} className="heart-pop">
              {post.liked ? "♥" : "♡"}
            </span>{" "}
            {post.likes}
          </button>
          <span style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>{post.commentCount} comentarios</span>
        </div>
      </article>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "18px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}>
        <div style={avatarStyle("accent-300", "accent-900", 40)}>{myInitials}</div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            ref={replyRef}
            className="input"
            placeholder={isMuted ? "Un admin te silenció. No puedes comentar por ahora." : "Suelta tu comentario…"}
            style={{ background: "var(--color-neutral-100)", minHeight: 60, fontSize: 15 }}
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            disabled={isMuted}
            maxLength={1000}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isGuest ? (
              <span style={{ flex: 1, fontSize: 12, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>{postAsLabel}</span>
            ) : (
              <>
                <AnonToggleButton anon={anon} alias={postAsLabel.replace(/^Publicas como /, "")} onClick={onToggleAnon} action="Comentar" />
                <span style={{ flex: 1 }} />
              </>
            )}
            <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{reply.length}/1000</span>
            <button className="btn btn-primary" onClick={onSendReply} disabled={isMuted}>
              Comentar
            </button>
          </div>
        </div>
      </div>

      {comments.map((c) => (
        <div
          key={c.id}
          className="list-item-enter"
          style={{
            display: "flex",
            gap: 14,
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            background: c.isBestAnswer ? "var(--color-accent-2-100)" : "var(--color-neutral-100)",
            boxShadow: "var(--shadow-sm)",
            border: c.isBestAnswer ? "1px solid var(--color-accent-2-400)" : "1px solid transparent",
          }}
        >
          <div className="alias-link" style={avatarForAlias(c.author, 38)} onClick={() => onViewProfile(c.author)}>
            {initials(c.author)}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              {c.isBestAnswer && <span className="tag tag-accent-2">✓ Mejor respuesta</span>}
              <span className="alias-link" style={{ fontWeight: 600, color: "var(--color-text)" }} onClick={() => onViewProfile(c.author)}>
                <NameText text={c.author} color={badges[c.author]?.nameColor} effect={badges[c.author]?.nameEffect} />
              </span>
              <Badge
                label={badges[c.author]?.label}
                color={badges[c.author]?.color}
                textColor={badges[c.author]?.textColor}
                effect={badges[c.author]?.effect}
              />
              <span>· {c.time}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{c.text}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button className="chip-btn" style={c.liked ? softOn(30) : soft(30)} onClick={() => onToggleCommentLike(c.id)}>
                <span key={c.liked ? "on" : "off"} className="heart-pop">
                  {c.liked ? "♥" : "♡"}
                </span>{" "}
                {c.likes}
              </button>
              <button className="btn btn-ghost" style={{ minHeight: 30, fontSize: 12.5 }} onClick={() => replyToComment(c.author)}>
                Responder
              </button>
              {canPickBestAnswer && (
                <button
                  className="btn btn-ghost chip-btn"
                  style={{ minHeight: 30, fontSize: 12.5, color: "var(--color-accent-2-700)" }}
                  onClick={() => onMarkBestAnswer(c.id)}
                >
                  {c.isBestAnswer ? "✕ Quitar mejor respuesta" : "✓ Marcar como mejor respuesta"}
                </button>
              )}
              <button
                className="btn btn-ghost"
                style={{ minHeight: 30, fontSize: 12.5, marginLeft: "auto" }}
                disabled={c.reported}
                onClick={() => onReportComment(c.id)}
              >
                {c.reported ? "🚩 Reportado" : "🚩 Reportar"}
              </button>
              {isAdmin && (
                <button
                  className="btn btn-ghost"
                  style={{ minHeight: 30, fontSize: 12.5, color: "var(--color-accent-2-700)" }}
                  onClick={() => onDeleteComment(c.id)}
                >
                  🗑 Eliminar (admin)
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDeletePost();
        }}
      />
    </div>
  );
}
