import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, setUserBadgeStyle } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_EFFECTS = new Set(["blink", "shift"]);

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`badge-style:${user.id}`, 20, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás editando tu insignia demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const colorRaw = typeof body?.color === "string" ? body.color.trim() : null;
  const effectRaw = typeof body?.effect === "string" ? body.effect : null;

  if (colorRaw && !/^#[0-9a-fA-F]{6}$/.test(colorRaw)) {
    return NextResponse.json({ error: "El color debe ser un código hexadecimal válido (#RRGGBB)." }, { status: 400 });
  }
  if (effectRaw && !VALID_EFFECTS.has(effectRaw)) {
    return NextResponse.json({ error: "Efecto inválido." }, { status: 400 });
  }

  const color = colorRaw || null;
  const effect = effectRaw === "blink" || effectRaw === "shift" ? effectRaw : null;

  await setUserBadgeStyle(user.id, color, effect);
  return NextResponse.json({ color, effect });
}
