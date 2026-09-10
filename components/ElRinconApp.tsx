"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CATEGORIES } from "@/lib/mock-data";
import { initials } from "@/lib/style-helpers";
import type { AppNotification, Category, Chat, DecoratedPost, RankingUser, Report, SortMode, View } from "@/lib/types";

const THEME_KEY = "rincon-theme";
const FOLLOWED_CATEGORIES_KEY = "rincon-followed-categories";

interface ProfileStats {
  karma: number;
  commentCount: number;
  rank: number;
  memberSince: string | null;
}

export default function ElRinconApp({
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
  const [openId, setOpenId] = useState<number | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [posts, setPosts] = useState<DecoratedPost[]>([]);
  const [openPost, setOpenPost] = useState<DecoratedPost | null>(null);
  const [threadComments, setThreadComments] = useState<import("@/lib/types").DecoratedComment[]>([]);
  const [liveRanking, setLiveRanking] = useState<RankingUser[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const activeChatId = chatId ?? chats[0]?.id ?? null;
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [reports, setReports] = useState<Report[]>([]);
  const [badges, setBadges] = useState<Record<string, string>>({});
  const [bios, setBios] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [followInfo, setFollowInfo] = useState<{ followers: number; following: number; isFollowing: boolean } | null>(null);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [followedCategoryIds, setFollowedCategoryIds] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [profilePosts, setProfilePosts] = useState<DecoratedPost[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStats>({ karma: 0, commentCount: 0, rank: 0, memberSince: null });

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

  async function refreshPosts() {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      // keep whatever posts we already have
    }
  }

  async function refreshRanking() {
    try {
      const res = await fetch("/api/ranking");
      const data = await res.json();
      setLiveRanking(data.ranking || []);
    } catch {
      // keep whatever ranking we already have
    }
  }

  async function refreshReports() {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) return;
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      // keep whatever reports we already have
    }
  }

  async function refreshThread(id: number) {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        setView("feed");
        return;
      }
      const data = await res.json();
      setOpenPost(data.post);
      setThreadComments(data.comments || []);
    } catch {
      // keep whatever thread state we already have
    }
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
    refreshPosts();
    refreshRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isGuest) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {
        // keep whatever notifications we already have
      });
  }, [isGuest]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((data) => {
        if (!cancelled) setReports(data.reports || []);
      })
      .catch(() => {
        // keep whatever reports we already have
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isGuest) return;
    refreshConversations();
    const interval = setInterval(refreshConversations, 8000);
    return () => clearInterval(interval);
  }, [isGuest]);

  useEffect(() => {
    if (!chatOpen || activeChatId == null) return;
    refreshMessages(activeChatId);
    const interval = setInterval(() => refreshMessages(activeChatId), 4000);
    return () => clearInterval(interval);
  }, [chatOpen, activeChatId]);

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
    if (sharedId) {
      openThread(sharedId);
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

  function categoryLabel(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  const myAlias = alias;
  const postAsLabel = isGuest ? "Inicia sesión para publicar" : anon ? "Publicas de forma anónima" : `Publicas como ${myAlias}`;
  const myInitials = initials(alias);

  const feedPosts = useMemo(() => {
    const activeLabel = cat === "all" ? null : categoryLabel(cat);
    let list = activeLabel ? posts.filter((p) => p.cat === activeLabel) : posts.slice();
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    if (sort === "Recientes") list = list.slice().reverse();
    if (sort === "Populares") {
      const engagement = (p: DecoratedPost) => p.votes + p.likes + p.commentCount * 2;
      list = list.slice().sort((a, b) => engagement(b) - engagement(a));
    }
    const pinned = list.filter((p) => p.pinned);
    const rest = list.filter((p) => !p.pinned);
    return [...pinned, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, cat, sort, search, categories]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) {
      counts[c.id] = c.id === "all" ? posts.length : posts.filter((p) => p.cat === c.name).length;
    }
    return counts;
  }, [posts, categories]);

  const myRank = isGuest ? 0 : profileStats.rank;

  const profileAlias = viewingAlias ?? alias;
  const isOwnProfile = !viewingAlias;

  useEffect(() => {
    if (view !== "profile" || !profileAlias) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/posts?author=${encodeURIComponent(profileAlias)}`).then((r) => r.json()),
      fetch(`/api/profile?alias=${encodeURIComponent(profileAlias)}`).then((r) => (r.ok ? r.json() : { karma: 0, commentCount: 0, rank: 0, memberSince: null })),
    ])
      .then(([postsData, statsData]) => {
        if (cancelled) return;
        setProfilePosts(postsData.posts || []);
        setProfileStats(statsData);
      })
      .catch(() => {
        // keep whatever profile state we already have
      });
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

  async function vote(id: number, dir: 1 | -1) {
    if (!requireAuth()) return;
    const res = await fetch(`/api/posts/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    });
    if (!res.ok) return;
    await refreshPosts();
    if (view === "thread" && openId === id) await refreshThread(id);
  }

  async function toggleLike(id: number) {
    if (!requireAuth()) return;
    const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    if (!res.ok) return;
    await refreshPosts();
    if (view === "thread" && openId === id) await refreshThread(id);
  }

  async function toggleCommentLike(commentId: number) {
    if (!requireAuth()) return;
    const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
    if (!res.ok) return;
    if (view === "thread" && openId != null) await refreshThread(openId);
  }

  async function votePoll(postId: number, optionId: number) {
    if (!requireAuth()) return;
    const res = await fetch(`/api/posts/${postId}/poll-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) return;
    await refreshPosts();
    if (view === "thread" && openId === postId) await refreshThread(postId);
  }

  function openThread(id: number) {
    setView("thread");
    setOpenId(id);
    setReply("");
    refreshThread(id);
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

  async function publish(pollOptions?: string[], isQuestion?: boolean): Promise<boolean> {
    if (!requireAuth()) return false;
    if (isMuted) return false;
    const text = draft.trim();
    if (!text) return false;
    const targetCat = cat === "all" ? "Vida de campus" : cat;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, cat: targetCat, pollOptions, isQuestion, anon }),
    });
    if (!res.ok) return false;
    setDraft("");
    setSort("Recientes");
    await refreshPosts();
    return true;
  }

  async function sendReply() {
    if (!requireAuth()) return;
    if (isMuted) return;
    if (openId == null) return;
    const text = reply.trim();
    if (!text) return;
    const res = await fetch(`/api/posts/${openId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, anon }),
    });
    if (!res.ok) return;
    setReply("");
    await refreshThread(openId);
    await refreshPosts();
  }

  async function saveAlias(next: string): Promise<string | undefined> {
    if (!requireAuth()) return "Inicia sesión para continuar.";
    const clean = next.trim().replace(/\s+/g, "");
    if (!clean) return "El nombre de usuario no puede estar vacío.";
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: clean }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "No se pudo guardar el nombre de usuario.";
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

  async function deletePost(id: number) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await refreshPosts();
    if (isAdmin) await refreshReports();
    if (view === "thread" && openId === id) setView("feed");
  }

  async function deleteComment(postId: number, commentId: number) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    await refreshThread(postId);
    await refreshPosts();
    if (isAdmin) await refreshReports();
  }

  async function markBestAnswer(postId: number, commentId: number) {
    const res = await fetch(`/api/posts/${postId}/best-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) return;
    await refreshThread(postId);
  }

  async function togglePin(id: number) {
    const res = await fetch(`/api/posts/${id}/pin`, { method: "POST" });
    if (!res.ok) return;
    await refreshPosts();
    if (view === "thread" && openId === id) await refreshThread(id);
  }

  async function reportPost(id: number) {
    if (!requireAuth()) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "post", postId: id }),
    });
    await refreshPosts();
    if (view === "thread" && openId === id) await refreshThread(id);
  }

  async function reportComment(postId: number, commentId: number) {
    if (!requireAuth()) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "comment", postId, commentId }),
    });
    await refreshThread(postId);
  }

  async function dismissReport(reportId: number) {
    await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    await refreshReports();
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
    if (cat === id) setCat("all");
  }

  async function refreshConversations() {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setChats((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        return (data.conversations || []).map((c: { id: number; alias: string; status: string; unread: boolean }) => ({
          id: c.id,
          alias: c.alias,
          status: c.status,
          unread: c.unread,
          msgs: prevById.get(c.id)?.msgs ?? [],
        }));
      });
    } catch {
      // keep whatever conversations we already have
    }
  }

  async function refreshMessages(conversationId: number) {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();
      setChats((prev) => prev.map((c) => (c.id === conversationId ? { ...c, msgs: data.messages || [], unread: false } : c)));
    } catch {
      // keep whatever messages we already have
    }
  }

  function selectChat(id: number) {
    setChatId(id);
    refreshMessages(id);
  }

  async function openChatWithAlias(targetAlias: string) {
    if (!requireAuth()) return;
    setChatOpen(true);
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: targetAlias }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast(data.error || "No se pudo abrir la conversación.");
        return;
      }
      setChats((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, { id: data.id, alias: data.alias, status: "Sin mensajes todavía", unread: false, msgs: [] }]));
      setChatId(data.id);
      await refreshMessages(data.id);
    } catch {
      pushToast("No se pudo abrir la conversación.");
    }
  }

  async function pushDm() {
    const text = dmDraft.trim();
    if (!text || activeChatId == null) return;
    setDmDraft("");
    try {
      const res = await fetch(`/api/messages/${activeChatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, msgs: data.messages || [], unread: false } : c)));
      await refreshConversations();
    } catch {
      // message just won't appear; user can retry
    }
  }

  async function markAllNotificationsRead() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications((data.notifications || []).map((n: AppNotification) => ({ ...n, read: true })));
      fetch("/api/notifications", { method: "POST" }).catch(() => {});
    } catch {
      // keep whatever notifications we already have
    }
  }

  function openNotification(n: AppNotification) {
    setNotifications((ns) => ns.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
    openThread(n.postId);
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
              feedTitle={search.trim() ? `Resultados para "${search.trim()}"` : cat === "all" ? "Publicaciones recientes" : categoryLabel(cat)}
              emptyMessage={search.trim() ? "No encontramos nada por aquí. Prueba con otra palabra." : "Todavía no hay nada por aquí. ¡Sé la primera persona en publicar!"}
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

          {view === "thread" && openPost && (
            <ThreadView
              post={openPost}
              comments={threadComments}
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
              karma={profileStats.karma}
              commentCount={profileStats.commentCount}
              rank={isOwnProfile ? myRank : profileStats.rank}
              memberSince={profileStats.memberSince}
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
        activeChatId={activeChatId}
        onSelectChat={selectChat}
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
