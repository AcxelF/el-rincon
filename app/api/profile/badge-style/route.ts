import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, setUserBadgeStyle } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_EFFECTS = new Set(["blink", "shift"]);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`badge-style:${user.id}`, 20, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás editando tu rango demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const colorRaw = typeof body?.color === "string" ? body.color.trim() : null;
  const textColorRaw = typeof body?.textColor === "string" ? body.textColor.trim() : null;
  const effectProvided = typeof body?.effect === "string" || body?.effect === null;
  const effectRaw = typeof body?.effect === "string" ? body.effect : null;

  if (colorRaw && !HEX_COLOR.test(colorRaw)) {
    return NextResponse.json({ error: "El color debe ser un código hexadecimal válido (#RRGGBB)." }, { status: 400 });
  }
  if (textColorRaw && !HEX_COLOR.test(textColorRaw)) {
    return NextResponse.json({ error: "El color del texto debe ser un código hexadecimal válido (#RRGGBB)." }, { status: 400 });
  }
  if (effectRaw && !VALID_EFFECTS.has(effectRaw)) {
    return NextResponse.json({ error: "Efecto inválido." }, { status: 400 });
  }
  if (effectRaw && !user.isAdmin) {
    return NextResponse.json({ error: "Solo los administradores pueden cambiar el efecto de su rango." }, { status: 403 });
  }

  const color = colorRaw || null;
  const textColor = textColorRaw || null;
  // Non-admins never touch the effect column at all — even to clear it — since they can't set
  // one in the first place. Admins can explicitly set it or clear it (effect: null).
  const effect = user.isAdmin && effectProvided ? (effectRaw === "blink" || effectRaw === "shift" ? effectRaw : null) : undefined;

  await setUserBadgeStyle(user.id, color, textColor, effect);
  return NextResponse.json({ color, textColor, effect: effect ?? null });
}
