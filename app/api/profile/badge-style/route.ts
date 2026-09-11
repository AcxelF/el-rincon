import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, setUserBadgeStyle } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { TextEffect } from "@/lib/types";

const VALID_EFFECTS = new Set<string>(["blink", "shift", "pulse", "glow", "shake", "outline"]);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function asEffect(raw: string | null): TextEffect | null {
  return raw && VALID_EFFECTS.has(raw) ? (raw as TextEffect) : null;
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`badge-style:${user.id}`, 20, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás editando tu rango demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const colorProvided = typeof body?.color === "string" || body?.color === null;
  const colorRaw = typeof body?.color === "string" ? body.color.trim() : null;
  const textColorProvided = typeof body?.textColor === "string" || body?.textColor === null;
  const textColorRaw = typeof body?.textColor === "string" ? body.textColor.trim() : null;
  const effectProvided = typeof body?.effect === "string" || body?.effect === null;
  const effectRaw = typeof body?.effect === "string" ? body.effect : null;
  const nameEffectProvided = typeof body?.nameEffect === "string" || body?.nameEffect === null;
  const nameEffectRaw = typeof body?.nameEffect === "string" ? body.nameEffect : null;

  if (colorRaw && !HEX_COLOR.test(colorRaw)) {
    return NextResponse.json({ error: "El color debe ser un código hexadecimal válido (#RRGGBB)." }, { status: 400 });
  }
  if (textColorRaw && !HEX_COLOR.test(textColorRaw)) {
    return NextResponse.json({ error: "El color del texto debe ser un código hexadecimal válido (#RRGGBB)." }, { status: 400 });
  }
  if (effectRaw && !VALID_EFFECTS.has(effectRaw)) {
    return NextResponse.json({ error: "Efecto inválido." }, { status: 400 });
  }
  if (nameEffectRaw && !VALID_EFFECTS.has(nameEffectRaw)) {
    return NextResponse.json({ error: "Efecto inválido." }, { status: 400 });
  }
  if ((effectRaw || nameEffectRaw) && !user.isAdmin) {
    return NextResponse.json({ error: "Solo los administradores pueden cambiar efectos de texto." }, { status: 403 });
  }

  // Non-admins never touch the effect columns at all — even to clear them — since they can't
  // set one in the first place. Admins can explicitly set or clear either one (value: null).
  const color = colorProvided ? colorRaw || null : undefined;
  const textColor = textColorProvided ? textColorRaw || null : undefined;
  const effect = user.isAdmin && effectProvided ? asEffect(effectRaw) : undefined;
  const nameEffect = user.isAdmin && nameEffectProvided ? asEffect(nameEffectRaw) : undefined;

  await setUserBadgeStyle(user.id, color, textColor, effect, nameEffect);
  return NextResponse.json({ color: color ?? null, textColor: textColor ?? null, effect: effect ?? null, nameEffect: nameEffect ?? null });
}
