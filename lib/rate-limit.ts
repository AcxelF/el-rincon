import type { NextRequest } from "next/server";
import { run, getOne } from "./db";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/** Fixed-window rate limiter backed by the database, so it holds across serverless instances. Returns true if the request is allowed. */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  await run(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (:key, :windowStart, 1)
     ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1`,
    { key, windowStart }
  );
  const row = await getOne<{ count: number }>("SELECT count FROM rate_limits WHERE key = :key AND window_start = :windowStart", {
    key,
    windowStart,
  });

  // Best-effort cleanup of old windows so the table doesn't grow unbounded.
  run("DELETE FROM rate_limits WHERE window_start < :cutoff", { cutoff: now - windowMs * 2 }).catch(() => {});

  return (row?.count ?? 0) <= limit;
}
