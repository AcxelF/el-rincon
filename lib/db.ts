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
  var __patioDb: Client | undefined;
  var __patioDbReady: Promise<void> | undefined;
}

export const db: Client =
  globalThis.__patioDb ??
  createClient({
    url: remoteUrl || "file:./data/app.db",
    authToken,
    intMode: "number",
  });
if (process.env.NODE_ENV !== "production") globalThis.__patioDb = db;

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

export const dbReady: Promise<void> = globalThis.__patioDbReady ?? migrate();
if (process.env.NODE_ENV !== "production") globalThis.__patioDbReady = dbReady;
