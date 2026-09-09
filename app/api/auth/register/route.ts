import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUser,
  findUserByAlias,
  isValidAlias,
  isValidPassword,
  normalizeAlias,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidAlias(alias)) {
    return NextResponse.json({ error: "El alias debe tener 3 a 24 caracteres: letras, números, puntos o guiones bajos." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (await findUserByAlias(alias)) {
    return NextResponse.json({ error: "Ese alias ya está en uso." }, { status: 409 });
  }

  const user = await createUser(alias, password);
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
