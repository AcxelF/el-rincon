import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByAlias, normalizeAlias, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const allowed = await checkRateLimit(`login:${getClientIp(request)}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos y vuelve a intentar." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await findUserByAlias(alias);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Alias o contraseña incorrectos." }, { status: 401 });
  }
  if (user.isBanned) {
    return NextResponse.json({ error: "Esta cuenta fue suspendida por un administrador." }, { status: 403 });
  }

  const session = await createSession(user.id);
  const response = NextResponse.json({
    user: { alias: user.alias, isAdmin: user.isAdmin, isBanned: user.isBanned, isMuted: user.isMuted, badge: user.badge },
  });
  response.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
