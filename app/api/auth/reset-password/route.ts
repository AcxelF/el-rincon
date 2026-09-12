import { NextRequest, NextResponse } from "next/server";
import { isValidPassword, normalizeAlias, resetPasswordWithRecoveryCode } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const allowed = await checkRateLimit(`reset-password:${getClientIp(request)}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const code = typeof body?.code === "string" ? body.code : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!alias || !code) return NextResponse.json({ error: "Completa el nombre de usuario y el código." }, { status: 400 });
  if (!isValidPassword(newPassword)) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });

  const accountAllowed = await checkRateLimit(`reset-password-account:${alias}`, 10, 60 * 60 * 1000);
  if (!accountAllowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

  const result = await resetPasswordWithRecoveryCode(alias, code, newPassword);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
