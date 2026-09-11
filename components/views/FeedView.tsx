"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, ChartBar, Check, Paperclip, Question } from "@phosphor-icons/react";
import type { Category, DecoratedPost, SortMode } from "@/lib/types";
import { ARROW, ARROW_DOWN, ARROW_UP, avatarForAlias, avatarStyle, initials, SORT, SORT_ON, soft, softOn } from "@/lib/style-helpers";
import { iconForCategory } from "@/lib/category-icons";
import Badge from "@/components/Badge";
import Poll from "@/components/Poll";
import FollowButton from "@/components/FollowButton";
import AnonToggleButton from "@/components/AnonToggleButton";

const SORTS: SortMode[] = ["Recientes", "Populares"];
const MAX_POLL_OPTIONS = 4;
const FEED_EXCERPT_LIMIT = 240;

function categoryTagIcon(id: string, emoji?: string) {
  const Icon = iconForCategory(id);
  return Icon ? <Icon size={13} weight="bold" /> : <span style={{ fontSize: 12 }}>{emoji}</span>;
}

function legacyCopy(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

async function sharePost(post: DecoratedPost): Promise<"copied" | "failed"> {
  const link = `${window.location.origin}/post/${post.id}`;
  const text = `Publicación: "${link}"`;
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return legacyCopy(text) ? "copied" : "failed";
  }
}

export default function FeedView({
  draft,
  onDraftChange,
  categories,
  defaultCatId,
  followedCategoryIds,
  postAsLabel,
  isGuest,
  anon,
  onToggleAnon,
  onPublish,
  feedTitle,
  emptyMessage,
  matchingUsers,
  sort,
  onSortChange,
  posts,
  onOpenPost,
  onVote,
  onToggleLike,
  myInitials,
  isAdmin,
  onDeletePost,
  onTogglePin,
  onReportPost,
  onVotePoll,
  onViewProfile,
  badges,
  isMuted,
  myAlias,
  followingSet,
  onToggleFollow,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  categories: Category[];
  defaultCatId: string;
  followedCategoryIds: string[];
  postAsLabel: string;
  isGuest: boolean;
  anon: boolean;
  onToggleAnon: () => void;
  onPublish: (catId: string, pollOptions?: string[], isQuestion?: boolean) => Promise<boolean>;
  feedTitle: string;
  emptyMessage: string;
  matchingUsers: { alias: string; badge: string | null }[];
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  posts: DecoratedPost[];
  onOpenPost: (id: number) => void;
  onVote: (id: number, dir: 1 | -1) => void;
  onToggleLike: (id: number) => void;
  myInitials: string;
  isAdmin: boolean;
  onDeletePost: (id: number) => void;
  onTogglePin: (id: number) => void;
  onReportPost: (id: number) => void;
  onVotePoll: (postId: number, optionId: number) => void;
  onViewProfile: (alias: string) => void;
  badges: Record<string, string>;
  isMuted: boolean;
  myAlias: string;
  followingSet: Set<string>;
  onToggleFollow: (alias: string) => void;
}) {
  const [shareState, setShareState] = useState<{ id: number; label: string } | null>(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [questionEnabled, setQuestionEnabled] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const [composeCat, setComposeCat] = useState(defaultCatId);
  const [prevDefaultCatId, setPrevDefaultCatId] = useState(defaultCatId);
  const [catManuallyPicked, setCatManuallyPicked] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [catMenuTab, setCatMenuTab] = useState<"tema" | "carrera">("tema");
  const [catQuery, setCatQuery] = useState("");
  const catMenuRef = useRef<HTMLDivElement>(null);

  // Follow whatever category the sidebar is browsing, unless the user already
  // chose a different one for the post they're currently writing.
  if (defaultCatId !== prevDefaultCatId) {
    setPrevDefaultCatId(defaultCatId);
    if (!catManuallyPicked) setComposeCat(defaultCatId);
  }

  useEffect(() => {
    if (!attachMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [attachMenuOpen]);

  useEffect(() => {
    if (!catMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [catMenuOpen]);

  const topicCats = categories.filter((c) => c.group === "tema");
  const followedCareer = categories.find((c) => c.group === "carrera" && followedCategoryIds.includes(c.id));
  const careerCats = categories
    .filter((c) => c.group === "carrera" && c.id !== followedCareer?.id)
    .filter((c) => c.name.toLowerCase().includes(catQuery.trim().toLowerCase()));
  const composeCategory = categories.find((c) => c.id === composeCat);

  function pickComposeCat(id: string) {
    setComposeCat(id);
    setCatManuallyPicked(true);
    setCatMenuOpen(false);
    setCatQuery("");
  }

  function toggleCatMenu() {
    setCatMenuOpen((o) => {
      const next = !o;
      if (next) setCatMenuTab(composeCategory?.group === "carrera" ? "carrera" : "tema");
      return next;
    });
  }

  function renderCategoryRow(c: Category) {
    const Icon = iconForCategory(c.id);
    const active = composeCat === c.id;
    return (
      <button
        key={c.id}
        type="button"
        className="chip-btn"
        onClick={() => pickComposeCat(c.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          border: 0,
          borderRadius: "var(--radius-sm)",
          background: active ? "var(--color-accent-200)" : "transparent",
          color: active ? "var(--color-accent-900)" : "var(--color-text)",
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {Icon ? <Icon size={16} style={{ flex: "none" }} /> : <span style={{ flex: "none" }}>{c.emoji}</span>}
        <span style={{ flex: 1 }}>{c.name}</span>
        {active && <Check size={14} weight="bold" style={{ flex: "none" }} />}
      </button>
    );
  }

  async function handleShare(post: DecoratedPost) {
    const result = await sharePost(post);
    const label = result === "copied" ? "✓ Link copiado" : "No se pudo copiar";
    setShareState({ id: post.id, label });
    setTimeout(() => setShareState((current) => (current?.id === post.id ? null : current)), 1600);
  }

  function togglePoll() {
    setPollEnabled((p) => {
      const next = !p;
      if (next) setQuestionEnabled(false);
      return next;
    });
  }

  function toggleQuestion() {
    setQuestionEnabled((q) => {
      const next = !q;
      if (next) setPollEnabled(false);
      return next;
    });
  }

  async function handlePublish() {
    const published = await onPublish(composeCat, pollEnabled ? pollOptions : undefined, questionEnabled);
    if (published) {
      setPollEnabled(false);
      setPollOptions(["", ""]);
      setQuestionEnabled(false);
      setCatManuallyPicked(false);
    }
  }

  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean).length;
  const pollBlocking = pollEnabled && validPollOptions < 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ padding: "20px 22px", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={avatarStyle("accent-300", "accent-900", 40)}>{myInitials}</div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <textarea
              className="input"
              placeholder={isMuted ? "Un admin te silenció. No puedes publicar por ahora." : "¿Qué quieres compartir?"}
              style={{ background: "var(--color-neutral-100)", minHeight: 74, fontSize: 15 }}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              disabled={isMuted}
              maxLength={2000}
            />

            {pollEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      placeholder={`Opción ${i + 1}`}
                      value={opt}
                      onChange={(e) => setPollOptions((opts) => opts.map((o, idx) => (idx === i ? e.target.value : o)))}
                      style={{ minHeight: 36, background: "var(--color-neutral-100)" }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        className="btn btn-ghost"
                        aria-label="Quitar opción"
                        onClick={() => setPollOptions((opts) => opts.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < MAX_POLL_OPTIONS && (
                  <button
                    className="btn btn-ghost"
                    style={{ alignSelf: "flex-start", fontSize: 12.5 }}
                    onClick={() => setPollOptions((opts) => [...opts, ""])}
                  >
                    + Agregar opción
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <div ref={catMenuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="tag tag-accent"
                    onClick={toggleCatMenu}
                    disabled={isMuted}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, border: 0, cursor: "pointer" }}
                  >
                    {categoryTagIcon(composeCat, composeCategory?.emoji)}
                    {composeCategory?.name ?? composeCat}
                    <CaretDown size={11} />
                  </button>

                  {catMenuOpen && (
                    <div className="attach-menu" style={{ top: "calc(100% + 8px)", left: 0, width: 260, padding: "6px 6px 0" }}>
                      <div style={{ display: "flex", gap: 4, paddingBottom: 6, borderBottom: "1px solid var(--color-divider)", marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={() => setCatMenuTab("tema")}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: "var(--radius-sm)",
                            border: 0,
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: 700,
                            background: catMenuTab === "tema" ? "var(--color-accent-200)" : "transparent",
                            color: catMenuTab === "tema" ? "var(--color-accent-900)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                          }}
                        >
                          Temas
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatMenuTab("carrera")}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: "var(--radius-sm)",
                            border: 0,
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: 700,
                            background: catMenuTab === "carrera" ? "var(--color-accent-200)" : "transparent",
                            color: catMenuTab === "carrera" ? "var(--color-accent-900)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                          }}
                        >
                          Carreras
                        </button>
                      </div>

                      <div style={{ maxHeight: 280, overflowY: "auto", paddingBottom: 6 }}>
                        {catMenuTab === "tema" && topicCats.map(renderCategoryRow)}

                        {catMenuTab === "carrera" && (
                          <>
                            {followedCareer && (
                              <>
                                <div
                                  style={{
                                    fontSize: 11,
                                    letterSpacing: ".08em",
                                    textTransform: "uppercase",
                                    color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                                    padding: "4px 10px 6px",
                                  }}
                                >
                                  Tu carrera
                                </div>
                                {renderCategoryRow(followedCareer)}
                                <div style={{ height: 1, background: "var(--color-divider)", margin: "6px 4px" }} />
                              </>
                            )}
                            <div style={{ padding: "2px 4px 6px" }}>
                              <input
                                className="input"
                                placeholder="Buscar carrera…"
                                value={catQuery}
                                onChange={(e) => setCatQuery(e.target.value)}
                                style={{ minHeight: 32, fontSize: 12.5 }}
                              />
                            </div>
                            {careerCats.map(renderCategoryRow)}
                            {careerCats.length === 0 && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  fontSize: 12.5,
                                  color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
                                }}
                              >
                                No encontramos esa carrera.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {pollEnabled && <span className="tag tag-accent-2">📊 Encuesta</span>}
                {questionEnabled && <span className="tag tag-accent-2">❓ Pregunta</span>}
                <div ref={attachMenuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="chip-btn"
                    aria-label="Tipo de publicación"
                    title="Tipo de publicación"
                    onClick={() => setAttachMenuOpen((o) => !o)}
                    disabled={isMuted}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: pollEnabled || questionEnabled ? "1px solid transparent" : "1px solid var(--color-divider)",
                      background: pollEnabled || questionEnabled ? "var(--color-accent-200)" : "transparent",
                      color: pollEnabled || questionEnabled ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                      cursor: "pointer",
                    }}
                  >
                    <Paperclip size={15} weight={pollEnabled || questionEnabled ? "fill" : "regular"} />
                  </button>

                  {attachMenuOpen && (
                    <div className="attach-menu" style={{ top: "calc(100% + 8px)", left: 0 }}>
                      <button
                        type="button"
                        className="chip-btn"
                        onClick={() => {
                          togglePoll();
                          setAttachMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 10px",
                          border: 0,
                          borderRadius: "var(--radius-sm)",
                          background: pollEnabled ? "var(--color-accent-200)" : "transparent",
                          color: pollEnabled ? "var(--color-accent-900)" : "var(--color-text)",
                          fontSize: 13.5,
                          fontWeight: pollEnabled ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <ChartBar size={16} style={{ flex: "none" }} />
                        <span style={{ flex: 1 }}>Encuesta</span>
                        {pollEnabled && <Check size={14} weight="bold" style={{ flex: "none" }} />}
                      </button>
                      <button
                        type="button"
                        className="chip-btn"
                        onClick={() => {
                          toggleQuestion();
                          setAttachMenuOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 10px",
                          border: 0,
                          borderRadius: "var(--radius-sm)",
                          background: questionEnabled ? "var(--color-accent-200)" : "transparent",
                          color: questionEnabled ? "var(--color-accent-900)" : "var(--color-text)",
                          fontSize: 13.5,
                          fontWeight: questionEnabled ? 600 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Question size={16} style={{ flex: "none" }} />
                        <span style={{ flex: 1 }}>Pregunta</span>
                        {questionEnabled && <Check size={14} weight="bold" style={{ flex: "none" }} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isGuest ? (
                  <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>{postAsLabel}</span>
                ) : (
                  <AnonToggleButton anon={anon} alias={postAsLabel.replace(/^Publicas como /, "")} onClick={onToggleAnon} action="Publicar" />
                )}
                <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{draft.length}/2000</span>
                <button className="btn btn-primary" onClick={handlePublish} disabled={isMuted || pollBlocking}>
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ fontSize: 29, margin: 0, lineHeight: 1.1 }}>{feedTitle}</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {SORTS.map((s) => (
            <button key={s} className="chip-btn" style={sort === s ? SORT_ON : SORT} onClick={() => onSortChange(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {matchingUsers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            Personas
          </div>
          {matchingUsers.map((u) => (
            <div
              key={u.alias}
              className="alias-link-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-neutral-100)",
                boxShadow: "var(--shadow-sm)",
              }}
              onClick={() => onViewProfile(u.alias)}
            >
              <div style={avatarForAlias(u.alias, 34)}>{initials(u.alias)}</div>
              <div className="alias-link-text" style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14.5 }}>{u.alias}</div>
              <Badge label={u.badge ?? undefined} />
            </div>
          ))}
        </div>
      )}

      {posts.length === 0 && matchingUsers.length === 0 && (
        <div style={{ padding: "28px 22px", textAlign: "center", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>{emptyMessage}</div>
      )}

      {posts.map((p) => (
        <article
          key={p.id}
          className="list-item-enter"
          style={{ display: "flex", gap: 16, padding: "20px 22px", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: "none", width: 50 }}>
            <button className="icon-btn" style={p.voteValue === 1 ? ARROW_UP : ARROW} onClick={() => onVote(p.id, 1)}>
              ▲
            </button>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{p.votes}</span>
            <button className="icon-btn" style={p.voteValue === -1 ? ARROW_DOWN : ARROW} onClick={() => onVote(p.id, -1)}>
              ▼
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 58%, transparent)" }}>
              {p.pinned && <span className="tag tag-accent">📌 Fijado</span>}
              {p.isQuestion && <span className="tag tag-accent">❓ Pregunta</span>}
              {p.isQuestion && p.bestAnswerId != null && <span className="tag tag-accent-2">✓ Resuelta</span>}
              <span className="tag tag-accent-2">{p.cat}</span>
              <span className="alias-link" style={{ fontWeight: 600, color: "var(--color-text)" }} onClick={() => onViewProfile(p.author)}>
                {p.author}
              </span>
              <Badge label={badges[p.author]} />
              {p.author !== myAlias && (
                <FollowButton compact isFollowing={followingSet.has(p.author)} onToggle={() => onToggleFollow(p.author)} />
              )}
              <span>· {p.time}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.2, cursor: "pointer" }} onClick={() => onOpenPost(p.id)}>
              {p.title}
            </h2>
            {p.excerpt !== p.title && (
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "color-mix(in srgb, var(--color-text) 78%, transparent)" }}>
                {p.excerpt.length > FEED_EXCERPT_LIMIT ? p.excerpt.slice(0, FEED_EXCERPT_LIMIT).trimEnd() + "…" : p.excerpt}
                {p.excerpt.length > FEED_EXCERPT_LIMIT && (
                  <>
                    {" "}
                    <span
                      onClick={() => onOpenPost(p.id)}
                      style={{ color: "var(--color-accent)", fontWeight: 600, cursor: "pointer" }}
                    >
                      Ver más
                    </span>
                  </>
                )}
              </p>
            )}
            {p.poll && <Poll poll={p.poll} onVote={(optionId) => onVotePoll(p.id, optionId)} />}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
              <button className="btn btn-secondary" style={{ minHeight: 34, fontSize: 13 }} onClick={() => onOpenPost(p.id)}>
                💬 {p.commentCount}
              </button>
              <button className="chip-btn" style={p.liked ? softOn() : soft()} onClick={() => onToggleLike(p.id)}>
                <span key={p.liked ? "on" : "off"} className="heart-pop">
                  {p.liked ? "♥" : "♡"}
                </span>{" "}
                {p.likes}
              </button>
              <button className="btn btn-ghost" style={{ minHeight: 34, fontSize: 13 }} onClick={() => handleShare(p)}>
                {shareState?.id === p.id ? shareState.label : "Compartir"}
              </button>
              <button
                className="btn btn-ghost"
                style={{ minHeight: 34, fontSize: 13 }}
                disabled={p.reported}
                onClick={() => onReportPost(p.id)}
              >
                {p.reported ? "🚩 Reportado" : "🚩 Reportar"}
              </button>
              {isAdmin && (
                <>
                  <button className="btn btn-ghost" style={{ minHeight: 34, fontSize: 13, marginLeft: "auto" }} onClick={() => onTogglePin(p.id)}>
                    {p.pinned ? "📌 Quitar" : "📌 Fijar"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ minHeight: 34, fontSize: 13, color: "var(--color-accent-2-700)" }}
                    onClick={() => onDeletePost(p.id)}
                  >
                    🗑 Eliminar (admin)
                  </button>
                </>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
