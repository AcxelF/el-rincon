import { run, getOne, getAll } from "./db";
import { CATEGORIES } from "./mock-data";
import { stripFormatMarkers } from "./format-text";
import type { AppNotification, DecoratedComment, DecoratedPoll, DecoratedPost, Report, RankingUser, VoteValue } from "./types";

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

function categoryLabel(id: string): string {
  return CATEGORY_NAMES[id] ?? id;
}

function randomAnonLabel(): string {
  return `anónimo_${Math.floor(1000 + Math.random() * 9000)}`;
}

function timeAgo(sqlDatetime: string): string {
  const then = new Date(sqlDatetime.replace(" ", "T") + "Z").getTime();
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  return `hace ${day} d`;
}

interface PostRow {
  id: number;
  cat: string;
  author: string;
  authorUserId: string | null;
  createdAt: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string | null;
  isQuestion: number;
  bestAnswerId: number | null;
  pinned: number;
  votes: number;
  likes: number;
  voteValue: number | null;
  liked: number;
  commentCount: number;
  reported: number;
}

const POST_SELECT = `
  SELECT
    p.id as id, p.cat as cat, p.author as author, p.author_user_id as authorUserId,
    p.created_at as createdAt, p.title as title, p.excerpt as excerpt, p.body as body, p.image_url as imageUrl,
    p.is_question as isQuestion, p.best_answer_id as bestAnswerId, p.pinned as pinned,
    COALESCE((SELECT SUM(value) FROM post_votes WHERE post_id = p.id), 0) as votes,
    COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = p.id), 0) as likes,
    (SELECT value FROM post_votes WHERE post_id = p.id AND user_id = :viewer) as voteValue,
    EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = :viewer) as liked,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount,
    EXISTS(SELECT 1 FROM reports WHERE kind = 'post' AND post_id = p.id) as reported
  FROM posts p
`;

async function decoratePollFor(postId: number, viewerUserId: string | null): Promise<DecoratedPoll | undefined> {
  const options = await getAll<{ id: number; text: string; votes: number }>(
    "SELECT id, text, votes FROM poll_options WHERE post_id = :postId ORDER BY position ASC",
    { postId }
  );
  if (options.length === 0) return undefined;
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  let myVote: number | null = null;
  if (viewerUserId) {
    const mv = await getOne<{ optionId: number }>(
      "SELECT option_id as optionId FROM poll_votes WHERE post_id = :postId AND user_id = :viewer",
      { postId, viewer: viewerUserId }
    );
    myVote = mv ? mv.optionId : null;
  }
  return {
    options: options.map((o) => ({ ...o, pct: totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0 })),
    totalVotes,
    myVote,
  };
}

async function decorateRow(row: PostRow, viewerUserId: string | null): Promise<DecoratedPost> {
  return {
    id: row.id,
    cat: categoryLabel(row.cat),
    author: row.author,
    time: timeAgo(row.createdAt),
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.imageUrl ?? null,
    votes: row.votes,
    commentCount: row.commentCount,
    voteValue: (row.voteValue ?? 0) as VoteValue,
    likes: row.likes,
    liked: !!row.liked,
    pinned: !!row.pinned,
    reported: !!row.reported,
    poll: await decoratePollFor(row.id, viewerUserId),
    isQuestion: !!row.isQuestion,
    bestAnswerId: row.bestAnswerId ?? null,
  };
}

export async function listPosts(viewerUserId: string | null): Promise<DecoratedPost[]> {
  const rows = await getAll<PostRow>(POST_SELECT + " ORDER BY p.id ASC", { viewer: viewerUserId });
  return Promise.all(rows.map((r) => decorateRow(r, viewerUserId)));
}

export async function getPost(id: number, viewerUserId: string | null): Promise<DecoratedPost | undefined> {
  const row = await getOne<PostRow>(POST_SELECT + " WHERE p.id = :id", { viewer: viewerUserId, id });
  return row ? decorateRow(row, viewerUserId) : undefined;
}

export async function listPostsByAuthor(authorUserId: string, viewerUserId: string | null, includeAnon: boolean): Promise<DecoratedPost[]> {
  const anonClause = includeAnon ? "" : "AND p.is_anon = 0";
  const rows = await getAll<PostRow>(
    POST_SELECT + ` WHERE p.author_user_id = :authorUserId ${anonClause} ORDER BY p.id DESC`,
    { viewer: viewerUserId, authorUserId }
  );
  return Promise.all(rows.map((r) => decorateRow(r, viewerUserId)));
}

interface CommentRow {
  id: number;
  author: string;
  authorUserId: string | null;
  createdAt: string;
  text: string;
  likes: number;
  liked: number;
  reported: number;
}

const COMMENT_SELECT = `
  SELECT
    c.id as id, c.author as author, c.author_user_id as authorUserId, c.created_at as createdAt, c.text as text,
    COALESCE((SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id), 0) as likes,
    EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = :viewer) as liked,
    EXISTS(SELECT 1 FROM reports WHERE kind = 'comment' AND comment_id = c.id) as reported
  FROM comments c
  WHERE c.post_id = :postId
  ORDER BY c.id ASC
`;

export async function listComments(postId: number, viewerUserId: string | null): Promise<DecoratedComment[]> {
  const post = await getOne<{ bestAnswerId: number | null }>("SELECT best_answer_id as bestAnswerId FROM posts WHERE id = :postId", { postId });
  const rows = await getAll<CommentRow>(COMMENT_SELECT, { viewer: viewerUserId, postId });
  const decorated = rows.map((r) => ({
    id: r.id,
    author: r.author,
    time: timeAgo(r.createdAt),
    text: r.text,
    likes: r.likes,
    liked: !!r.liked,
    reported: !!r.reported,
    isBestAnswer: r.id === post?.bestAnswerId,
  }));
  return decorated.sort((a, b) => Number(b.isBestAnswer) - Number(a.isBestAnswer));
}

export async function commentsAuthoredBy(userId: string): Promise<number> {
  const row = await getOne<{ c: number }>("SELECT COUNT(*) as c FROM comments WHERE author_user_id = :userId", { userId });
  return row?.c ?? 0;
}

export async function karmaFor(userId: string): Promise<number> {
  const row = await getOne<{ karma: number }>(
    `SELECT
      COALESCE((SELECT SUM(value) FROM post_votes pv JOIN posts p ON p.id = pv.post_id WHERE p.author_user_id = :userId), 0) +
      COALESCE((SELECT COUNT(*) FROM post_likes pl JOIN posts p ON p.id = pl.post_id WHERE p.author_user_id = :userId), 0) +
      COALESCE((SELECT COUNT(*) FROM comment_likes cl JOIN comments c ON c.id = cl.comment_id WHERE c.author_user_id = :userId), 0)
      as karma`,
    { userId }
  );
  return row?.karma ?? 0;
}

export async function getRanking(limit = 100): Promise<RankingUser[]> {
  const rows = await getAll<{ alias: string; badge: string | null; bio: string | null; karma: number }>(
    `SELECT u.alias as alias, u.badge as badge, u.bio as bio,
      COALESCE((SELECT SUM(value) FROM post_votes pv JOIN posts p ON p.id = pv.post_id WHERE p.author_user_id = u.id), 0) +
      COALESCE((SELECT COUNT(*) FROM post_likes pl JOIN posts p ON p.id = pl.post_id WHERE p.author_user_id = u.id), 0) +
      COALESCE((SELECT COUNT(*) FROM comment_likes cl JOIN comments c ON c.id = cl.comment_id WHERE c.author_user_id = u.id), 0)
      as karma
    FROM users u
    ORDER BY karma DESC, u.created_at ASC
    LIMIT :limit`,
    { limit }
  );
  return rows.map((r) => ({
    alias: r.alias,
    meta: r.bio ? r.bio.slice(0, 28) : "Recién llegado al rincón",
    badge: r.badge || "Nuevo por aquí",
    karma: r.karma,
  }));
}

export async function createPost(opts: {
  userId: string;
  alias: string;
  anon: boolean;
  cat: string;
  text: string;
  title?: string;
  imageUrl?: string | null;
  pollOptions?: string[];
  isQuestion?: boolean;
}): Promise<number> {
  const author = opts.anon ? randomAnonLabel() : opts.alias;
  const title = opts.title?.trim() || (opts.text.length > 70 ? opts.text.slice(0, 70) + "…" : opts.text);
  const result = await run(
    `INSERT INTO posts (cat, author, author_user_id, is_anon, title, excerpt, body, image_url, is_question)
     VALUES (:cat, :author, :userId, :isAnon, :title, :excerpt, :body, :imageUrl, :isQuestion)`,
    {
      cat: opts.cat,
      author,
      userId: opts.userId,
      isAnon: opts.anon ? 1 : 0,
      title,
      excerpt: opts.text,
      body: opts.text,
      imageUrl: opts.imageUrl ?? null,
      isQuestion: opts.isQuestion ? 1 : 0,
    }
  );
  const postId = Number(result.lastInsertRowid);
  const cleanOptions = (opts.pollOptions ?? []).map((o) => o.trim()).filter(Boolean);
  if (cleanOptions.length >= 2) {
    for (let i = 0; i < cleanOptions.length; i++) {
      await run("INSERT INTO poll_options (post_id, text, position) VALUES (:postId, :text, :position)", { postId, text: cleanOptions[i], position: i });
    }
  }
  return postId;
}

/** Keeps this user's already-published (non-anonymous) posts and comments showing their current alias after a rename. */
export async function renameAuthorEverywhere(userId: string, alias: string): Promise<void> {
  await run("UPDATE posts SET author = :alias WHERE author_user_id = :userId AND is_anon = 0", { alias, userId });
  await run("UPDATE comments SET author = :alias WHERE author_user_id = :userId AND is_anon = 0", { alias, userId });
}

export async function addComment(postId: number, opts: { userId: string; alias: string; anon: boolean; text: string }): Promise<number> {
  const author = opts.anon ? randomAnonLabel() : opts.alias;
  const result = await run(
    "INSERT INTO comments (post_id, author, author_user_id, is_anon, text) VALUES (:postId, :author, :userId, :isAnon, :text)",
    { postId, author, userId: opts.userId, isAnon: opts.anon ? 1 : 0, text: opts.text }
  );
  await notifyNewComment(postId, opts.userId);
  return Number(result.lastInsertRowid);
}

export async function toggleVote(postId: number, userId: string, dir: 1 | -1): Promise<void> {
  const existing = await getOne<{ value: number }>("SELECT value FROM post_votes WHERE post_id = :postId AND user_id = :userId", { postId, userId });
  const newValue = existing?.value === dir ? 0 : dir;
  if (newValue === 0) {
    await run("DELETE FROM post_votes WHERE post_id = :postId AND user_id = :userId", { postId, userId });
  } else {
    await run(
      `INSERT INTO post_votes (post_id, user_id, value) VALUES (:postId, :userId, :value)
       ON CONFLICT(post_id, user_id) DO UPDATE SET value = excluded.value`,
      { postId, userId, value: newValue }
    );
    await notifyPostReaction(postId, userId, "vote");
  }
}

export async function toggleLike(postId: number, userId: string): Promise<void> {
  const existing = await getOne("SELECT 1 as x FROM post_likes WHERE post_id = :postId AND user_id = :userId", { postId, userId });
  if (existing) {
    await run("DELETE FROM post_likes WHERE post_id = :postId AND user_id = :userId", { postId, userId });
  } else {
    await run("INSERT INTO post_likes (post_id, user_id) VALUES (:postId, :userId)", { postId, userId });
    await notifyPostReaction(postId, userId, "like");
  }
}

export async function toggleCommentLike(commentId: number, userId: string): Promise<void> {
  const existing = await getOne("SELECT 1 as x FROM comment_likes WHERE comment_id = :commentId AND user_id = :userId", { commentId, userId });
  if (existing) {
    await run("DELETE FROM comment_likes WHERE comment_id = :commentId AND user_id = :userId", { commentId, userId });
  } else {
    await run("INSERT INTO comment_likes (comment_id, user_id) VALUES (:commentId, :userId)", { commentId, userId });
    await notifyCommentLike(commentId, userId);
  }
}

export async function votePoll(postId: number, userId: string, optionId: number): Promise<void> {
  const prev = await getOne<{ optionId: number }>("SELECT option_id as optionId FROM poll_votes WHERE post_id = :postId AND user_id = :userId", {
    postId,
    userId,
  });
  if (prev?.optionId === optionId) return;
  if (prev) {
    await run("UPDATE poll_options SET votes = votes - 1 WHERE id = :optionId AND votes > 0", { optionId: prev.optionId });
  }
  await run("UPDATE poll_options SET votes = votes + 1 WHERE id = :optionId", { optionId });
  await run(
    `INSERT INTO poll_votes (post_id, user_id, option_id) VALUES (:postId, :userId, :optionId)
     ON CONFLICT(post_id, user_id) DO UPDATE SET option_id = excluded.option_id`,
    { postId, userId, optionId }
  );
}

export async function deletePost(postId: number): Promise<void> {
  await run("DELETE FROM poll_votes WHERE post_id = :postId", { postId });
  await run("DELETE FROM poll_options WHERE post_id = :postId", { postId });
  await run("DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id = :postId)", { postId });
  await run("DELETE FROM comments WHERE post_id = :postId", { postId });
  await run("DELETE FROM post_votes WHERE post_id = :postId", { postId });
  await run("DELETE FROM post_likes WHERE post_id = :postId", { postId });
  await run("DELETE FROM reports WHERE post_id = :postId", { postId });
  await run("DELETE FROM notifications WHERE post_id = :postId", { postId });
  await run("DELETE FROM posts WHERE id = :postId", { postId });
}

export async function deleteComment(commentId: number): Promise<void> {
  await run("DELETE FROM comment_likes WHERE comment_id = :commentId", { commentId });
  await run("UPDATE posts SET best_answer_id = NULL WHERE best_answer_id = :commentId", { commentId });
  await run("DELETE FROM reports WHERE comment_id = :commentId", { commentId });
  await run("DELETE FROM notifications WHERE comment_id = :commentId", { commentId });
  await run("DELETE FROM comments WHERE id = :commentId", { commentId });
}

export async function getPostOwnerUserId(postId: number): Promise<string | null> {
  const row = await getOne<{ authorUserId: string | null }>("SELECT author_user_id as authorUserId FROM posts WHERE id = :postId", { postId });
  return row?.authorUserId ?? null;
}

export async function togglePin(postId: number): Promise<void> {
  await run("UPDATE posts SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END WHERE id = :postId", { postId });
}

export async function toggleBestAnswer(postId: number, commentId: number): Promise<void> {
  const post = await getOne<{ bestAnswerId: number | null }>("SELECT best_answer_id as bestAnswerId FROM posts WHERE id = :postId", { postId });
  const next = post?.bestAnswerId === commentId ? null : commentId;
  await run("UPDATE posts SET best_answer_id = :next WHERE id = :postId", { postId, next });
}

export async function reportPost(postId: number): Promise<{ ok: boolean; error?: string }> {
  const post = await getOne("SELECT 1 as x FROM posts WHERE id = :postId", { postId });
  if (!post) return { ok: false, error: "La publicación no existe." };

  const existing = await getOne("SELECT 1 as x FROM reports WHERE kind = 'post' AND post_id = :postId", { postId });
  if (!existing) await run("INSERT INTO reports (kind, post_id) VALUES ('post', :postId)", { postId });
  return { ok: true };
}

export async function reportComment(postId: number, commentId: number): Promise<{ ok: boolean; error?: string }> {
  const comment = await getOne("SELECT 1 as x FROM comments WHERE id = :commentId AND post_id = :postId", { commentId, postId });
  if (!comment) return { ok: false, error: "El comentario no existe." };

  const existing = await getOne("SELECT 1 as x FROM reports WHERE kind = 'comment' AND comment_id = :commentId", { commentId });
  if (!existing) await run("INSERT INTO reports (kind, post_id, comment_id) VALUES ('comment', :postId, :commentId)", { postId, commentId });
  return { ok: true };
}

export async function dismissReport(reportId: number): Promise<void> {
  await run("DELETE FROM reports WHERE id = :reportId", { reportId });
}

interface ReportRow {
  id: number;
  kind: "post" | "comment";
  postId: number;
  commentId: number | null;
  postTitle: string;
  author: string;
  snippet: string;
  reportedAt: string;
}

export async function listReports(): Promise<Report[]> {
  const rows = await getAll<ReportRow>(`
    SELECT r.id as id, r.kind as kind, r.post_id as postId, r.comment_id as commentId,
      p.title as postTitle,
      CASE WHEN r.kind = 'comment' THEN c.author ELSE p.author END as author,
      CASE WHEN r.kind = 'comment' THEN c.text ELSE p.excerpt END as snippet,
      r.created_at as reportedAt
    FROM reports r
    JOIN posts p ON p.id = r.post_id
    LEFT JOIN comments c ON c.id = r.comment_id
    ORDER BY r.id DESC
  `);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    postId: r.postId,
    commentId: r.commentId ?? undefined,
    postTitle: r.postTitle,
    author: r.author,
    snippet: r.snippet,
    reportedAt: timeAgo(r.reportedAt),
  }));
}

interface NotificationRow {
  id: number;
  type: AppNotification["type"];
  postId: number;
  commentId: number | null;
  message: string;
  createdAt: string;
  read: number;
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const rows = await getAll<NotificationRow>(
    "SELECT id, type, post_id as postId, comment_id as commentId, message, created_at as createdAt, read FROM notifications WHERE user_id = :userId ORDER BY id DESC LIMIT 50",
    { userId }
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    postId: r.postId,
    commentId: r.commentId ?? undefined,
    message: r.message,
    time: timeAgo(r.createdAt),
    read: !!r.read,
  }));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await run("UPDATE notifications SET read = 1 WHERE user_id = :userId AND read = 0", { userId });
}

async function notifyPostReaction(postId: number, actorUserId: string, type: "vote" | "like"): Promise<void> {
  const post = await getOne<{ authorUserId: string | null; title: string }>("SELECT author_user_id as authorUserId, title FROM posts WHERE id = :postId", {
    postId,
  });
  if (!post?.authorUserId || post.authorUserId === actorUserId) return;
  const title = stripFormatMarkers(post.title);
  const message = type === "vote" ? `Tu hilo "${title}" recibió un voto nuevo.` : `A alguien le gustó tu hilo "${title}".`;
  await run("INSERT INTO notifications (user_id, type, post_id, message) VALUES (:userId, :type, :postId, :message)", {
    userId: post.authorUserId,
    type,
    postId,
    message,
  });
}

async function notifyNewComment(postId: number, actorUserId: string): Promise<void> {
  const post = await getOne<{ authorUserId: string | null; title: string }>("SELECT author_user_id as authorUserId, title FROM posts WHERE id = :postId", {
    postId,
  });
  if (!post?.authorUserId || post.authorUserId === actorUserId) return;
  await run("INSERT INTO notifications (user_id, type, post_id, message) VALUES (:userId, 'comment', :postId, :message)", {
    userId: post.authorUserId,
    postId,
    message: `Nuevo comentario en tu hilo "${stripFormatMarkers(post.title)}".`,
  });
}

async function notifyCommentLike(commentId: number, actorUserId: string): Promise<void> {
  const row = await getOne<{ authorUserId: string | null; postId: number; postTitle: string }>(
    `SELECT c.author_user_id as authorUserId, c.post_id as postId, p.title as postTitle
     FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = :commentId`,
    { commentId }
  );
  if (!row?.authorUserId || row.authorUserId === actorUserId) return;
  await run("INSERT INTO notifications (user_id, type, post_id, comment_id, message) VALUES (:userId, 'commentLike', :postId, :commentId, :message)", {
    userId: row.authorUserId,
    postId: row.postId,
    commentId,
    message: `A alguien le gustó tu comentario en "${stripFormatMarkers(row.postTitle)}".`,
  });
}
