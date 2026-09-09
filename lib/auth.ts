import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { run, getOne, getAll } from "./db";

export const SESSION_COOKIE_NAME = "patio_session";
const SESSION_DAYS = 30;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export interface AuthUser {
  id: string;
  alias: string;
  isAdmin: boolean;
  isBanned: boolean;
  isMuted: boolean;
  bannedUntil: number | null;
  mutedUntil: number | null;
  badge: string | null;
  bio: string | null;
}

export function normalizeAlias(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function isValidAlias(alias: string): boolean {
  return /^@[a-zA-Z0-9_.]{2,24}$/.test(alias);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 200;
}

export function isValidBio(bio: string): boolean {
  return bio.length <= 160;
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

interface UserRow {
  id: string;
  alias: string;
  isAdmin: number;
  isBanned: number;
  isMuted: number;
  bannedUntil: number | null;
  mutedUntil: number | null;
  badge: string | null;
  bio: string | null;
}

function isExpired(until: number | null): boolean {
  return until !== null && until <= Date.now();
}

function toAuthUser(row: UserRow): AuthUser {
  const banned = !!row.isBanned && !isExpired(row.bannedUntil);
  const muted = !!row.isMuted && !isExpired(row.mutedUntil);
  return {
    id: row.id,
    alias: row.alias,
    isAdmin: !!row.isAdmin,
    isBanned: banned,
    isMuted: muted,
    bannedUntil: banned ? row.bannedUntil : null,
    mutedUntil: muted ? row.mutedUntil : null,
    badge: row.badge ?? null,
    bio: row.bio ?? null,
  };
}

const USER_FIELDS =
  "id, alias, is_admin as isAdmin, is_banned as isBanned, is_muted as isMuted, banned_until as bannedUntil, muted_until as mutedUntil, badge, bio";

export async function findUserByAlias(alias: string): Promise<(AuthUser & { passwordHash: string }) | undefined> {
  const row = await getOne<UserRow & { passwordHash: string }>(
    `SELECT ${USER_FIELDS}, password_hash as passwordHash FROM users WHERE alias = ? COLLATE NOCASE`,
    [alias]
  );
  return row ? { ...toAuthUser(row), passwordHash: row.passwordHash } : undefined;
}

export async function createUser(alias: string, password: string, isAdmin = false): Promise<AuthUser> {
  const id = randomUUID();
  await run("INSERT INTO users (id, alias, password_hash, is_admin) VALUES (?, ?, ?, ?)", [id, alias, hashPassword(password), isAdmin ? 1 : 0]);
  return { id, alias, isAdmin, isBanned: false, isMuted: false, bannedUntil: null, mutedUntil: null, badge: null, bio: null };
}

export async function updateUserAlias(userId: string, alias: string) {
  await run("UPDATE users SET alias = ? WHERE id = ?", [alias, userId]);
}

export async function updateUserBio(userId: string, bio: string) {
  await run("UPDATE users SET bio = ? WHERE id = ?", [bio.trim() || null, userId]);
}

export async function createSession(userId: string): Promise<{ token: string }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt]);
  return { token };
}

export async function destroySession(token: string) {
  await run("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function destroySessionsForUser(userId: string) {
  await run("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | undefined> {
  const row = await getOne<UserRow & { expiresAt: number }>(
    `SELECT users.id as id, users.alias as alias, users.is_admin as isAdmin, users.is_banned as isBanned, users.is_muted as isMuted,
            users.banned_until as bannedUntil, users.muted_until as mutedUntil, users.badge as badge, users.bio as bio, sessions.expires_at as expiresAt
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token = ?`,
    [token]
  );
  if (!row) return undefined;
  if (row.expiresAt < Date.now()) {
    await destroySession(token);
    return undefined;
  }
  return toAuthUser(row);
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | undefined> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : undefined;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser | undefined> {
  const user = await getUserFromRequest(request);
  return user?.isAdmin ? user : undefined;
}

export interface AdminUserRow extends AuthUser {
  createdAt: string;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const rows = await getAll<UserRow & { createdAt: string }>(`SELECT ${USER_FIELDS}, created_at as createdAt FROM users ORDER BY created_at DESC`);
  return rows.map((r) => ({ ...toAuthUser(r), createdAt: r.createdAt }));
}

export async function setUserBanned(alias: string, banned: boolean, durationMs?: number): Promise<AuthUser | undefined> {
  const user = await findUserByAlias(alias);
  if (!user) return undefined;
  const until = banned && durationMs ? Date.now() + durationMs : null;
  await run("UPDATE users SET is_banned = ?, banned_until = ? WHERE id = ?", [banned ? 1 : 0, until, user.id]);
  if (banned) await destroySessionsForUser(user.id);
  return {
    id: user.id,
    alias: user.alias,
    isAdmin: user.isAdmin,
    isBanned: banned,
    isMuted: user.isMuted,
    bannedUntil: until,
    mutedUntil: user.mutedUntil,
    badge: user.badge,
    bio: user.bio,
  };
}

export async function setUserMuted(alias: string, muted: boolean, durationMs?: number): Promise<AuthUser | undefined> {
  const user = await findUserByAlias(alias);
  if (!user) return undefined;
  const until = muted && durationMs ? Date.now() + durationMs : null;
  await run("UPDATE users SET is_muted = ?, muted_until = ? WHERE id = ?", [muted ? 1 : 0, until, user.id]);
  return {
    id: user.id,
    alias: user.alias,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    isMuted: muted,
    bannedUntil: user.bannedUntil,
    mutedUntil: until,
    badge: user.badge,
    bio: user.bio,
  };
}

export async function setUserBadge(alias: string, badge: string | null): Promise<AuthUser | undefined> {
  const user = await findUserByAlias(alias);
  if (!user) return undefined;
  const clean = badge?.trim() || null;
  await run("UPDATE users SET badge = ? WHERE id = ?", [clean, user.id]);
  return {
    id: user.id,
    alias: user.alias,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    isMuted: user.isMuted,
    bannedUntil: user.bannedUntil,
    mutedUntil: user.mutedUntil,
    badge: clean,
    bio: user.bio,
  };
}

export async function getBadgeMap(): Promise<Record<string, string>> {
  const rows = await getAll<{ alias: string; badge: string }>("SELECT alias, badge FROM users WHERE badge IS NOT NULL AND badge != ''");
  const map: Record<string, string> = {};
  for (const r of rows) map[r.alias] = r.badge;
  return map;
}

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

export async function getFollowStats(alias: string, viewerId?: string): Promise<FollowStats> {
  const user = await findUserByAlias(alias);
  if (!user) return { followers: 0, following: 0, isFollowing: false };

  const followers = (await getOne<{ c: number }>("SELECT COUNT(*) as c FROM follows WHERE followee_id = ?", [user.id]))!.c;
  const following = (await getOne<{ c: number }>("SELECT COUNT(*) as c FROM follows WHERE follower_id = ?", [user.id]))!.c;
  const isFollowing = !!viewerId && !!(await getOne("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?", [viewerId, user.id]));

  return { followers, following, isFollowing };
}

export async function followUser(followerId: string, followeeAlias: string): Promise<{ ok: boolean; error?: string }> {
  const followee = await findUserByAlias(followeeAlias);
  if (!followee) return { ok: false, error: "No existe una cuenta con ese alias." };
  if (followee.id === followerId) return { ok: false, error: "No puedes seguirte a ti mismo." };
  await run("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)", [followerId, followee.id]);
  return { ok: true };
}

export async function unfollowUser(followerId: string, followeeAlias: string) {
  const followee = await findUserByAlias(followeeAlias);
  if (!followee) return;
  await run("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", [followerId, followee.id]);
}

export async function getFollowingAliases(userId: string): Promise<string[]> {
  const rows = await getAll<{ alias: string }>(
    "SELECT users.alias as alias FROM follows JOIN users ON users.id = follows.followee_id WHERE follows.follower_id = ?",
    [userId]
  );
  return rows.map((r) => r.alias);
}

export async function getBioMap(): Promise<Record<string, string>> {
  const rows = await getAll<{ alias: string; bio: string }>("SELECT alias, bio FROM users WHERE bio IS NOT NULL AND bio != ''");
  const map: Record<string, string> = {};
  for (const r of rows) map[r.alias] = r.bio;
  return map;
}
