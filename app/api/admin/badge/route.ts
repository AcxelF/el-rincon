import { NextRequest, NextResponse } from "next/server";
import { normalizeAlias, requireAdmin, setUserBadge } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BADGE_LENGTH = 24;

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const allowed = await checkRateLimit(`admin-badge:${admin.id}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Demasiadas acciones seguidas. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const badgeRaw = typeof body?.badge === "string" ? body.badge.trim() : "";

  if (badgeRaw.length > MAX_BADGE_LENGTH) {
    return NextResponse.json({ error: `La insignia debe tener ${MAX_BADGE_LENGTH} caracteres o menos.` }, { status: 400 });
  }

  const user = await setUserBadge(alias, badgeRaw || null);
  if (!user) return NextResponse.json({ error: "No existe una cuenta con ese nombre de usuario." }, { status: 404 });

  return NextResponse.json({ user });
}
