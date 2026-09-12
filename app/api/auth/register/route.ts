import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUser,
  isAliasOrHandleTaken,
  isValidAlias,
  isValidPassword,
  normalizeAlias,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const allowed = await checkRateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas cuentas creadas desde aquí. Intenta de nuevo más tarde." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidAlias(alias)) {
    return NextResponse.json({ error: "El nombre de usuario debe tener 3 a 24 caracteres: letras, números, puntos o guiones bajos." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (await isAliasOrHandleTaken(alias)) {
    return NextResponse.json({ error: "Ese nombre de usuario ya está en uso." }, { status: 409 });
  }

  const user = await createUser(alias, password);
  const session = await createSession(user.id);

  const response = NextResponse.json({
    user: { alias: user.alias, isAdmin: user.isAdmin, isBanned: user.isBanned, isMuted: user.isMuted, badge: user.badge },
    recoveryCode: user.recoveryCode,
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
