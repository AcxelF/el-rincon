import { run, getOne, getAll } from "./db";

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

export interface ConversationSummary {
  id: number;
  alias: string;
  status: string;
  unread: boolean;
}

export interface MessageOut {
  me: boolean;
  text: string;
}

export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<number> {
  const [a, b] = [userId, otherUserId].sort();
  const existing = await getOne<{ id: number }>("SELECT id FROM conversations WHERE user_a_id = :a AND user_b_id = :b", { a, b });
  if (existing) return existing.id;
  const result = await run("INSERT INTO conversations (user_a_id, user_b_id) VALUES (:a, :b)", { a, b });
  return Number(result.lastInsertRowid);
}

export async function listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const rows = await getAll<{ id: number; otherAlias: string; lastMessageAt: string | null; createdAt: string; unread: number }>(
    `SELECT c.id as id,
      u.alias as otherAlias,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as lastMessageAt,
      c.created_at as createdAt,
      EXISTS(SELECT 1 FROM messages WHERE conversation_id = c.id AND sender_id != :userId AND read = 0) as unread
    FROM conversations c
    JOIN users u ON u.id = (CASE WHEN c.user_a_id = :userId THEN c.user_b_id ELSE c.user_a_id END)
    WHERE c.user_a_id = :userId OR c.user_b_id = :userId
    ORDER BY COALESCE(lastMessageAt, c.created_at) DESC`,
    { userId }
  );
  return rows.map((r) => ({
    id: r.id,
    alias: r.otherAlias,
    status: r.lastMessageAt ? `Último mensaje ${timeAgo(r.lastMessageAt)}` : "Sin mensajes todavía",
    unread: !!r.unread,
  }));
}

export async function listMessages(conversationId: number, viewerId: string): Promise<MessageOut[]> {
  const rows = await getAll<{ senderId: string; text: string }>(
    "SELECT sender_id as senderId, text FROM messages WHERE conversation_id = :conversationId ORDER BY id ASC",
    { conversationId }
  );
  return rows.map((r) => ({ me: r.senderId === viewerId, text: r.text }));
}

export async function markConversationRead(conversationId: number, viewerId: string): Promise<void> {
  await run("UPDATE messages SET read = 1 WHERE conversation_id = :conversationId AND sender_id != :viewerId AND read = 0", {
    conversationId,
    viewerId,
  });
}

export async function sendMessage(conversationId: number, senderId: string, text: string): Promise<void> {
  await run("INSERT INTO messages (conversation_id, sender_id, text) VALUES (:conversationId, :senderId, :text)", {
    conversationId,
    senderId,
    text,
  });
}

export async function isParticipant(conversationId: number, userId: string): Promise<boolean> {
  const row = await getOne(
    "SELECT 1 as x FROM conversations WHERE id = :conversationId AND (user_a_id = :userId OR user_b_id = :userId)",
    { conversationId, userId }
  );
  return !!row;
}
