"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import RailLeft from "@/components/RailLeft";
import RailRight from "@/components/RailRight";
import FeedView from "@/components/views/FeedView";
import ThreadView from "@/components/views/ThreadView";
import RankView from "@/components/views/RankView";
import ChatWidget from "@/components/ChatWidget";
import ProfileView from "@/components/views/ProfileView";
import AdminView from "@/components/views/AdminView";
import ToastStack, { type ToastItem } from "@/components/ToastStack";
import BottomNav from "@/components/BottomNav";
import { CATEGORIES, INITIAL_CHATS, INITIAL_POSTS, MY_ANON_ALIAS, RANKING } from "@/lib/mock-data";
import { initials } from "@/lib/style-helpers";
import type { AppNotification, Category, Chat, DecoratedComment, DecoratedPoll, DecoratedPost, Post, RankingUser, Report, SortMode, VoteValue, View } from "@/lib/types";

const THEME_KEY = "patio-theme";
const FOLLOWED_CATEGORIES_KEY = "patio-followed-categories";

export default function PatioApp({
  initialAlias,
  isAdmin,
  isMuted,
  isGuest = false,
  onRequireAuth,
  onLogout,
}: {
  initialAlias: string;
  isAdmin: boolean;
  isMuted: boolean;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onLogout: () => void;
}) {
  const [view, setView] = useState<View>("feed");
  const [viewingAlias, setViewingAlias] = useState<string | null>(null);
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<SortMode>("Recientes");
  const [search, setSearch] = useState("");
  const [alias, setAlias] = useState(initialAlias);
  const [anon, setAnon] = useState(false);
  const [dark, setDark] = useState(false);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("");
  const [dmDraft, setDmDraft] = useState("");
  const [openId, setOpenId] = useState(1);
  const [chatId, setChatId] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [nextId, setNextId] = useState(200);
  const [votes, setVotes] = useState<Record<number, VoteValue>>({});
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [cLikes, setCLikes] = useState<Record<number, boolean>>({});
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [nextChatId, setNextChatId] = useState(100);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [nextReportId, setNextReportId] = useState(1);
  const [badges, setBadges] = useState<Record<string, string>>({});
  const [bios, setBios] = useState<Record<string, string>>({});
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [followInfo, setFollowInfo] = useState<{ followers: number; following: number; isFollowing: boolean } | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [followedCategoryIds, setFollowedCategoryIds] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  function pushToast(message: string) {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message }]);
    setTimeout(() => {
      setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setToasts((ts) => ts.filter((t) => t.id !== id));
      }, 200);
    }, 2600);
  }

  function refreshBadges() {
    fetch("/api/users/badges")
      .then((r) => r.json())
      .then((data) => setBadges(data.badges || {}))
      .catch(() => {
        // keep whatever badges we already have
      });
  }

  function refreshBios() {
    fetch("/api/users/bios")
      .then((r) => r.json())
      .then((data) => setBios(data.bios || {}))
      .catch(() => {
        // keep whatever bios we already have
      });
  }

  function refreshFollowing() {
    fetch("/api/follow/mine")
      .then((r) => r.json())
      .then((data) => setFollowingSet(new Set<string>(data.following || [])))
      .catch(() => {
        // keep whatever follow info we already have
      });
  }

  useEffect(() => {
    // Synced from localStorage (an external system) once on mount — the layout's
    // blocking script already painted the body attribute, this just aligns the icon.
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "dark") setDark(true);
    } catch {
      // localStorage unavailable — keep default light theme
    }
    try {
      const savedCats = window.localStorage.getItem(FOLLOWED_CATEGORIES_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCats) setFollowedCategoryIds(JSON.parse(savedCats));
    } catch {
      // localStorage unavailable — no followed categories yet
    }
    refreshBadges();
    refreshBios();
    refreshFollowing();
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const sharedId = Number(new URLSearchParams(window.location.search).get("post"));
    if (sharedId && posts.some((p) => p.id === sharedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("thread");
      setOpenId(sharedId);
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(next: boolean) {
    document.body.setAttribute("data-theme", next ? "dark" : "light");
    try {
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // ignore write failures (private browsing, etc.)
    }
    setDark(next);
  }

  function requireAuth(): boolean {
    if (isGuest) {
      onRequireAuth?.();
      return false;
    }
    return true;
  }

  function votesFor(p: Post) {
    return p.votes + (votes[p.id] || 0);
  }

  function likesFor(p: Post) {
    return p.likes + (likes[p.id] ? 1 : 0);
  }

  function commentsAuthoredBy(targetAlias: string): number {
    return posts.reduce((sum, p) => sum + p.comments.filter((c) => c.author === targetAlias).length, 0);
  }

  function karmaFor(targetAlias: string): number {
    let total = 0;
    for (const p of posts) {
      if (p.author === targetAlias) total += votesFor(p) + likesFor(p);
      for (const c of p.comments) {
        if (c.author === targetAlias) total += c.likes + (cLikes[c.id] ? 1 : 0);
      }
    }
    return total;
  }

  const prevVotesRef = useRef<Record<number, number>>({});
  const prevLikesRef = useRef<Record<number, number>>({});
  const prevCommentCountRef = useRef<Record<number, number>>({});
  const prevCommentLikesRef = useRef<Record<number, number>>({});
  const notifBaselineSetRef = useRef(false);
  const nextNotifIdRef = useRef(1);

  useEffect(() => {
    if (isGuest) return;
    const prevVotes = prevVotesRef.current;
    const prevLikes = prevLikesRef.current;
    const prevCommentCount = prevCommentCountRef.current;
    const prevCommentLikes = prevCommentLikesRef.current;
    const fresh: AppNotification[] = [];
    const isBaseline = !notifBaselineSetRef.current;

    function makeNotification(type: AppNotification["type"], postId: number, commentId: number | undefined, message: string) {
      fresh.push({ id: nextNotifIdRef.current++, type, postId, commentId, message, time: "justo ahora", read: false });
    }

    for (const p of posts) {
      const isMine = p.author === alias;
      const curVotes = votesFor(p);
      const curLikes = likesFor(p);
      const curComments = p.comments.length;
      const prevVoteCount = prevVotes[p.id] ?? curVotes;
      const prevLikeCount = prevLikes[p.id] ?? curLikes;
      const prevCCount = prevCommentCount[p.id] ?? curComments;

      if (isMine && !isBaseline) {
        if (curVotes > prevVoteCount) {
          makeNotification("vote", p.id, undefined, `Tu hilo "${p.title}" recibió un voto nuevo.`);
        }
        if (curLikes > prevLikeCount) {
          makeNotification("like", p.id, undefined, `A alguien le gustó tu hilo "${p.title}".`);
        }
        if (curComments > prevCCount) {
          const added = p.comments.slice(Math.max(0, prevCCount)).filter((c) => c.author !== alias);
          if (added.length === 1) {
            makeNotification("comment", p.id, added[0].id, `Nuevo comentario en tu hilo "${p.title}".`);
          } else if (added.length > 1) {
            makeNotification("comment", p.id, undefined, `${added.length} comentarios nuevos en tu hilo "${p.title}".`);
          }
        }
      }

      prevVotes[p.id] = curVotes;
      prevLikes[p.id] = curLikes;
      prevCommentCount[p.id] = curComments;

      for (const c of p.comments) {
        const curCommentLikes = c.likes + (cLikes[c.id] ? 1 : 0);
        const prevCommentLikeCount = prevCommentLikes[c.id] ?? curCommentLikes;
        if (c.author === alias && !isBaseline && curCommentLikes > prevCommentLikeCount) {
          makeNotification("commentLike", p.id, c.id, `A alguien le gustó tu comentario en "${p.title}".`);
        }
        prevCommentLikes[c.id] = curCommentLikes;
      }
    }

    if (fresh.length) {
      setNotifications((ns) => [...fresh.reverse(), ...ns].slice(0, 50));
    }
    notifBaselineSetRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, votes, likes, cLikes, alias, isGuest]);

  function markAllNotificationsRead() {
    setNotifications((ns) => (ns.every((n) => n.read) ? ns : ns.map((n) => ({ ...n, read: true }))));
  }

  function openNotification(n: AppNotification) {
    setNotifications((ns) => ns.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
    openThread(n.postId);
  }

  function categoryLabel(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  function decoratePoll(p: Post): DecoratedPoll | undefined {
    if (!p.poll) return undefined;
    const totalVotes = p.poll.options.reduce((sum, o) => sum + o.votes, 0);
    return {
      options: p.poll.options.map((o) => ({ ...o, pct: totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0 })),
      totalVotes,
      myVote: pollVotes[p.id] ?? null,
    };
  }

  function decoratePost(p: Post): DecoratedPost {
    return {
      id: p.id,
      cat: categoryLabel(p.cat),
      author: p.author,
      time: p.time,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      votes: votesFor(p),
      commentCount: p.comments.length,
      voteValue: votes[p.id] || 0,
      likes: likesFor(p),
      liked: !!likes[p.id],
      pinned: pinnedIds.includes(p.id),
      reported: reports.some((r) => r.kind === "post" && r.postId === p.id),
      poll: decoratePoll(p),
      isQuestion: !!p.isQuestion,
      bestAnswerId: p.bestAnswerId ?? null,
    };
  }

  const openPost = posts.find((p) => p.id === openId) || posts[0];
  const chat = chats.find((c) => c.id === chatId) || chats[0];
  const myAlias = anon ? MY_ANON_ALIAS : alias;
  const postAsLabel = isGuest ? "Inicia sesión para publicar" : `Publicas como ${myAlias}`;
  const myInitials = initials(alias);

  const feedPosts = useMemo(() => {
    let list = cat === "all" ? posts.slice() : posts.filter((p) => p.cat === cat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    if (sort === "Recientes") list = list.slice().reverse();
    if (sort === "Populares") {
      const engagement = (p: Post) => votesFor(p) + likesFor(p) + p.comments.length * 2;
      list = list.slice().sort((a, b) => engagement(b) - engagement(a));
    }
    const pinned = list.filter((p) => pinnedIds.includes(p.id));
    const rest = list.filter((p) => !pinnedIds.includes(p.id));
    return [...pinned, ...rest].map(decoratePost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, cat, sort, search, votes, likes, pinnedIds, reports, pollVotes]);

  const decoratedComments: DecoratedComment[] = (openPost.comments || [])
    .map((c) => ({
      id: c.id,
      author: c.author,
      time: c.time,
      text: c.text,
      likes: c.likes + (cLikes[c.id] ? 1 : 0),
      liked: !!cLikes[c.id],
      reported: reports.some((r) => r.kind === "comment" && r.commentId === c.id),
      isBestAnswer: c.id === openPost.bestAnswerId,
    }))
    .sort((a, b) => Number(b.isBestAnswer) - Number(a.isBestAnswer));

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) {
      counts[c.id] = c.id === "all" ? posts.length : posts.filter((p) => p.cat === c.id).length;
    }
    return counts;
  }, [posts, categories]);

  const liveRanking: RankingUser[] = useMemo(() => {
    const list = RANKING.map((r) => ({ ...r, karma: r.karma + karmaFor(r.alias) }));
    if (!isGuest && !RANKING.some((r) => r.alias === alias)) {
      list.push({
        alias,
        meta: bios[alias] ? bios[alias]!.slice(0, 28) : "Recién llegado al rincón",
        badge: badges[alias] || "Nuevo por aquí",
        karma: karmaFor(alias),
      });
    }
    return list.sort((a, b) => b.karma - a.karma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, votes, likes, cLikes, alias, isGuest, badges, bios]);

  const myRank = isGuest ? 0 : liveRanking.findIndex((r) => r.alias === alias) + 1;

  const minePosts = posts.filter((p) => p.author === alias).map(decoratePost);

  const profileAlias = viewingAlias ?? alias;
  const isOwnProfile = !viewingAlias;
  const profilePosts = viewingAlias ? posts.filter((p) => p.author === viewingAlias).map(decoratePost) : minePosts;

  useEffect(() => {
    if (view !== "profile" || !profileAlias) return;
    let cancelled = false;
    fetch(`/api/follow?alias=${encodeURIComponent(profileAlias)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setFollowInfo(data);
      })
      .catch(() => {
        // keep whatever follow info we already have
      });
    return () => {
      cancelled = true;
    };
  }, [view, profileAlias]);

  async function toggleFollow(targetAlias: string) {
    if (!requireAuth()) return;
    const nextFollow = !followingSet.has(targetAlias);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: targetAlias, follow: nextFollow }),
    });
    const data = await res.json();
    if (!res.ok) {
      pushToast(data.error || "No se pudo actualizar. Intenta de nuevo.");
      return;
    }
    setFollowingSet((prev) => {
      const next = new Set(prev);
      if (data.isFollowing) next.add(targetAlias);
      else next.delete(targetAlias);
      return next;
    });
    if (targetAlias === profileAlias) setFollowInfo(data);
  }

  function viewProfile(targetAlias: string) {
    setViewingAlias(targetAlias === alias ? null : targetAlias);
    setView("profile");
  }

  function vote(id: number, dir: 1 | -1) {
    if (!requireAuth()) return;
    setVotes((v) => ({ ...v, [id]: v[id] === dir ? 0 : dir }));
  }
  function toggleLike(id: number) {
    if (!requireAuth()) return;
    setLikes((l) => ({ ...l, [id]: !l[id] }));
  }
  function toggleCommentLike(id: number) {
    if (!requireAuth()) return;
    setCLikes((c) => ({ ...c, [id]: !c[id] }));
  }
  function votePoll(postId: number, optionId: number) {
    if (!requireAuth()) return;
    const prevOptionId = pollVotes[postId];
    if (prevOptionId === optionId) return;
    setPosts((ps) =>
      ps.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        const options = p.poll.options.map((o) => {
          if (o.id === optionId) return { ...o, votes: o.votes + 1 };
          if (o.id === prevOptionId) return { ...o, votes: Math.max(0, o.votes - 1) };
          return o;
        });
        return { ...p, poll: { options } };
      })
    );
    setPollVotes((pv) => ({ ...pv, [postId]: optionId }));
  }
  function openThread(id: number) {
    setView("thread");
    setOpenId(id);
    setReply("");
  }

  function pickCategory(id: string) {
    setCat(id);
    setView("feed");
    setMobileNavOpen(false);
  }

  function toggleFollowCategory(id: string) {
    if (!requireAuth()) return;
    setFollowedCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      try {
        window.localStorage.setItem(FOLLOWED_CATEGORIES_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — the preference just won't survive a reload
      }
      return next;
    });
  }

  function publish(pollOptions?: string[], isQuestion?: boolean): boolean {
    if (!requireAuth()) return false;
    if (isMuted) return false;
    const text = draft.trim();
    if (!text) return false;
    const targetCat = cat === "all" ? "Vida de campus" : cat;
    const cleanOptions = (pollOptions ?? []).map((o) => o.trim()).filter(Boolean);
    const poll = cleanOptions.length >= 2 ? { options: cleanOptions.map((optText, i) => ({ id: i + 1, text: optText, votes: 0 })) } : undefined;
    setPosts((ps) => [
      ...ps,
      {
        id: nextId,
        cat: targetCat,
        author: anon ? MY_ANON_ALIAS : alias,
        time: "ahora mismo",
        votes: 1,
        likes: 0,
        title: text.length > 70 ? text.slice(0, 70) + "…" : text,
        excerpt: text,
        body: text,
        comments: [],
        poll,
        isQuestion: !!isQuestion,
        bestAnswerId: null,
      },
    ]);
    setDraft("");
    setSort("Recientes");
    setNextId((n) => n + 1);
    return true;
  }

  function sendReply() {
    if (!requireAuth()) return;
    if (isMuted) return;
    const text = reply.trim();
    if (!text) return;
    setPosts((ps) =>
      ps.map((p) =>
        p.id !== openPost.id
          ? p
          : {
              ...p,
              comments: [...p.comments, { id: nextId, author: anon ? MY_ANON_ALIAS : alias, time: "ahora mismo", text, likes: 0 }],
            }
      )
    );
    setReply("");
    setNextId((n) => n + 1);
  }

  async function saveAlias(next: string): Promise<string | undefined> {
    if (!requireAuth()) return "Inicia sesión para continuar.";
    const clean = next.trim().replace(/\s+/g, "");
    if (!clean) return "El alias no puede estar vacío.";
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: clean }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "No se pudo guardar el alias.";
    setAlias(data.user.alias);
    return undefined;
  }

  async function saveBio(next: string): Promise<string | undefined> {
    if (!requireAuth()) return "Inicia sesión para continuar.";
    const clean = next.trim();
    if (clean.length > 160) return "La descripción no puede superar los 160 caracteres.";
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: clean }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "No se pudo guardar la descripción.";
    setBios((b) => ({ ...b, [alias]: data.user.bio || "" }));
    return undefined;
  }

  function deletePost(id: number) {
    setPosts((ps) => ps.filter((p) => p.id !== id));
    setPinnedIds((ids) => ids.filter((i) => i !== id));
    setReports((rs) => rs.filter((r) => r.postId !== id));
    if (view === "thread" && openId === id) setView("feed");
  }

  function deleteComment(postId: number, commentId: number) {
    setPosts((ps) =>
      ps.map((p) => (p.id !== postId ? p : { ...p, comments: p.comments.filter((c) => c.id !== commentId) }))
    );
    setReports((rs) => rs.filter((r) => r.commentId !== commentId));
  }

  function markBestAnswer(postId: number, commentId: number) {
    setPosts((ps) =>
      ps.map((p) => (p.id !== postId ? p : { ...p, bestAnswerId: p.bestAnswerId === commentId ? null : commentId }))
    );
  }

  function togglePin(id: number) {
    setPinnedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function reportPost(id: number) {
    if (!requireAuth()) return;
    const post = posts.find((p) => p.id === id);
    if (!post || reports.some((r) => r.kind === "post" && r.postId === id)) return;
    setReports((rs) => [
      ...rs,
      { id: nextReportId, kind: "post", postId: id, postTitle: post.title, author: post.author, snippet: post.excerpt, reportedAt: "ahora mismo" },
    ]);
    setNextReportId((n) => n + 1);
  }

  function reportComment(postId: number, commentId: number) {
    if (!requireAuth()) return;
    const post = posts.find((p) => p.id === postId);
    const comment = post?.comments.find((c) => c.id === commentId);
    if (!post || !comment || reports.some((r) => r.kind === "comment" && r.commentId === commentId)) return;
    setReports((rs) => [
      ...rs,
      {
        id: nextReportId,
        kind: "comment",
        postId,
        commentId,
        postTitle: post.title,
        author: comment.author,
        snippet: comment.text,
        reportedAt: "ahora mismo",
      },
    ]);
    setNextReportId((n) => n + 1);
  }

  function dismissReport(reportId: number) {
    setReports((rs) => rs.filter((r) => r.id !== reportId));
  }

  function addCategory(name: string, emoji: string) {
    const clean = name.trim();
    if (!clean) return;
    const id = clean.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
    setCategories((cs) => [...cs, { id, name: clean, emoji: emoji.trim() || "🏷️" }]);
  }

  function renameCategory(id: string, name: string) {
    const clean = name.trim();
    if (!clean) return;
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, name: clean } : c)));
  }

  function deleteCategory(id: string) {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setPosts((ps) => ps.map((p) => (p.cat === id ? { ...p, cat: "Vida de campus" } : p)));
    if (cat === id) setCat("all");
  }

  function openChatWithAlias(targetAlias: string) {
    const existing = chats.find((c) => c.alias === targetAlias);
    if (existing) {
      setChatId(existing.id);
    } else {
      const newChat: Chat = { id: nextChatId, alias: targetAlias, status: "alias registrado", unread: false, msgs: [] };
      setChats((cs) => [...cs, newChat]);
      setChatId(nextChatId);
      setNextChatId((n) => n + 1);
    }
    setChatOpen(true);
  }

  function pushDm() {
    const text = dmDraft.trim();
    if (!text) return;
    setChats((cs) => cs.map((c) => (c.id !== chatId ? c : { ...c, msgs: [...c.msgs, { me: true, text }], unread: false })));
    setDmDraft("");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Header
        view={view}
        dark={dark}
        anon={anon}
        alias={alias}
        myInitials={myInitials}
        search={search}
        onSearchChange={(q) => {
          setSearch(q);
          if (q.trim()) setView("feed");
        }}
        onTabClick={setView}
        onToggleTheme={() => setTheme(!dark)}
        onToggleAnon={() => setAnon((a) => !a)}
        onGoProfile={() => {
          setViewingAlias(null);
          setView("profile");
        }}
        onGoFeed={() => setView("feed")}
        isAdmin={isAdmin}
        reportsCount={reports.length}
        isGuest={isGuest}
        onRequireAuth={() => requireAuth()}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        notifications={notifications}
        onOpenNotification={openNotification}
        onMarkAllNotificationsRead={markAllNotificationsRead}
      />

      <div className={`mobile-nav-backdrop${mobileNavOpen ? " is-open" : ""}`} onClick={() => setMobileNavOpen(false)} />
      <div className={`mobile-nav-panel${mobileNavOpen ? " is-open" : ""}`}>
        <RailLeft
          variant="drawer"
          onClose={() => setMobileNavOpen(false)}
          activeCat={cat}
          counts={catCounts}
          categories={categories}
          onPick={pickCategory}
          followedCategoryIds={followedCategoryIds}
          onToggleFollowCategory={toggleFollowCategory}
        />
      </div>

      <div className="shell">
        <RailLeft
          activeCat={cat}
          counts={catCounts}
          categories={categories}
          onPick={pickCategory}
          followedCategoryIds={followedCategoryIds}
          onToggleFollowCategory={toggleFollowCategory}
        />

        <main style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          {view === "feed" && (
            <FeedView
              draft={draft}
              onDraftChange={setDraft}
              draftCatLabel={cat === "all" ? "Vida de campus" : categoryLabel(cat)}
              postAsLabel={postAsLabel}
              isGuest={isGuest}
              anon={anon}
              onToggleAnon={() => setAnon((a) => !a)}
              onPublish={publish}
              feedTitle={search.trim() ? `Resultados para "${search.trim()}"` : cat === "all" ? "Lo que se está cocinando" : categoryLabel(cat)}
              sort={sort}
              onSortChange={setSort}
              posts={feedPosts}
              onOpenPost={openThread}
              onVote={vote}
              onToggleLike={toggleLike}
              myInitials={myInitials}
              isAdmin={isAdmin}
              onDeletePost={deletePost}
              onTogglePin={togglePin}
              onReportPost={reportPost}
              onVotePoll={votePoll}
              onViewProfile={viewProfile}
              badges={badges}
              isMuted={isMuted}
              myAlias={alias}
              followingSet={followingSet}
              onToggleFollow={toggleFollow}
            />
          )}

          {view === "thread" && (
            <ThreadView
              post={decoratePost(openPost)}
              comments={decoratedComments}
              reply={reply}
              onReplyChange={setReply}
              onSendReply={sendReply}
              postAsLabel={postAsLabel}
              isGuest={isGuest}
              anon={anon}
              onToggleAnon={() => setAnon((a) => !a)}
              onBack={() => setView("feed")}
              onVote={(dir) => vote(openPost.id, dir)}
              onToggleLike={() => toggleLike(openPost.id)}
              onToggleCommentLike={toggleCommentLike}
              onVotePoll={(optionId) => votePoll(openPost.id, optionId)}
              myInitials={myInitials}
              isAdmin={isAdmin}
              onDeletePost={() => deletePost(openPost.id)}
              onDeleteComment={(commentId) => deleteComment(openPost.id, commentId)}
              onTogglePin={() => togglePin(openPost.id)}
              onReportPost={() => reportPost(openPost.id)}
              onReportComment={(commentId) => reportComment(openPost.id, commentId)}
              onMarkBestAnswer={(commentId) => markBestAnswer(openPost.id, commentId)}
              onViewProfile={viewProfile}
              badges={badges}
              isMuted={isMuted}
              myAlias={alias}
              followingSet={followingSet}
              onToggleFollow={toggleFollow}
            />
          )}

          {view === "rank" && <RankView ranking={liveRanking} />}

          {view === "profile" && (
            <ProfileView
              mine={profilePosts}
              onOpenPost={openThread}
              alias={profileAlias}
              myInitials={isOwnProfile ? myInitials : initials(profileAlias)}
              isSelf={isOwnProfile}
              isAdmin={isAdmin}
              onSaveAlias={saveAlias}
              onSaveBio={saveBio}
              onLogout={onLogout}
              onBack={() => {
                setViewingAlias(null);
                setView("feed");
              }}
              onMessage={() => {
                if (!requireAuth()) return;
                openChatWithAlias(profileAlias);
              }}
              onToast={pushToast}
              onBadgeChanged={refreshBadges}
              badge={badges[profileAlias]}
              bio={bios[profileAlias]}
              followers={followInfo?.followers ?? 0}
              following={followInfo?.following ?? 0}
              isFollowing={followInfo?.isFollowing ?? false}
              onToggleFollow={() => toggleFollow(profileAlias)}
              karma={karmaFor(profileAlias)}
              commentCount={commentsAuthoredBy(profileAlias)}
              rank={isOwnProfile ? myRank : liveRanking.findIndex((r) => r.alias === profileAlias) + 1}
            />
          )}

          {view === "admin" && isAdmin && (
            <AdminView
              reports={reports}
              onDismissReport={dismissReport}
              onOpenReport={(postId) => openThread(postId)}
              onDeletePost={deletePost}
              onDeleteComment={deleteComment}
              categories={categories}
              onAddCategory={addCategory}
              onRenameCategory={renameCategory}
              onDeleteCategory={deleteCategory}
              currentAlias={alias}
              onBadgeChanged={refreshBadges}
              onMessageUser={openChatWithAlias}
              onViewProfile={viewProfile}
              onToast={pushToast}
            />
          )}
        </main>

        <RailRight ranking={liveRanking} onGoRank={() => setView("rank")} />
      </div>

      <ToastStack toasts={toasts} />

      <BottomNav view={view} onTabClick={setView} isAdmin={isAdmin} reportsCount={reports.length} />

      {!chatOpen && (
        <button
          onClick={() => requireAuth() && setChatOpen(true)}
          aria-label="Abrir mensajes"
          className="chat-fab"
          style={{
            position: "fixed",
            bottom: "var(--floating-offset)",
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 999,
            border: 0,
            background: "var(--color-accent)",
            color: "var(--color-neutral-100)",
            display: "grid",
            placeItems: "center",
            fontSize: 26,
            cursor: "pointer",
            boxShadow: "var(--shadow-lg)",
            zIndex: 50,
          }}
        >
          💬
          {chats.some((c) => c.unread) && (
            <span
              className="notify-dot"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "var(--color-accent-2)",
                border: "2px solid var(--color-bg)",
              }}
            />
          )}
        </button>
      )}

      <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        chats={chats}
        activeChatId={chat.id}
        onSelectChat={setChatId}
        dmDraft={dmDraft}
        onDmDraftChange={setDmDraft}
        onDmKey={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            pushDm();
          }
        }}
        onSendDm={pushDm}
        badges={badges}
      />
    </div>
  );
}
