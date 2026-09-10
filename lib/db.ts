import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!remoteUrl) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

declare global {
  var __rinconDb: Client | undefined;
  var __rinconDbReady: Promise<void> | undefined;
}

export const db: Client =
  globalThis.__rinconDb ??
  createClient({
    url: remoteUrl || "file:./data/app.db",
    authToken,
    intMode: "number",
  });
if (process.env.NODE_ENV !== "production") globalThis.__rinconDb = db;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    alias TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_banned INTEGER NOT NULL DEFAULT 0,
    is_muted INTEGER NOT NULL DEFAULT 0,
    banned_until INTEGER,
    muted_until INTEGER,
    badge TEXT,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, followee_id)
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cat TEXT NOT NULL,
    author TEXT NOT NULL,
    author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_anon INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    body TEXT NOT NULL,
    is_question INTEGER NOT NULL DEFAULT 0,
    best_answer_id INTEGER,
    pinned INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position INTEGER NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    is_anon INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    text TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS post_votes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    comment_id INTEGER,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (key, window_start)
  )`,
];

async function migrate() {
  await db.execute("PRAGMA foreign_keys = ON");
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }

  // Migrations for databases created before these columns existed.
  const userColumns = (await db.execute("PRAGMA table_info(users)")).rows.map((r) => r.name as string);
  for (const column of ["is_admin", "is_banned", "is_muted"]) {
    if (!userColumns.includes(column)) {
      await db.execute(`ALTER TABLE users ADD COLUMN ${column} INTEGER NOT NULL DEFAULT 0`);
    }
  }
  for (const column of ["badge", "bio"]) {
    if (!userColumns.includes(column)) {
      await db.execute(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
    }
  }
  for (const column of ["banned_until", "muted_until"]) {
    if (!userColumns.includes(column)) {
      await db.execute(`ALTER TABLE users ADD COLUMN ${column} INTEGER`);
    }
  }
}

export const dbReady: Promise<void> = globalThis.__rinconDbReady ?? migrate();
if (process.env.NODE_ENV !== "production") globalThis.__rinconDbReady = dbReady;

export type SqlArg = string | number | null;
export type SqlArgs = SqlArg[] | Record<string, SqlArg>;

export async function run(sql: string, args: SqlArgs = []) {
  await dbReady;
  return db.execute({ sql, args });
}

export async function getOne<T>(sql: string, args: SqlArgs = []): Promise<T | undefined> {
  await dbReady;
  const result = await db.execute({ sql, args });
  return result.rows[0] as unknown as T | undefined;
}

export async function getAll<T>(sql: string, args: SqlArgs = []): Promise<T[]> {
  await dbReady;
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}
