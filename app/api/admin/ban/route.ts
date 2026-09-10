import { NextRequest, NextResponse } from "next/server";
import { normalizeAlias, requireAdmin, setUserBanned } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const allowed = await checkRateLimit(`admin-ban:${admin.id}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Demasiadas acciones seguidas. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const banned = !!body?.banned;
  const durationMs = typeof body?.durationMs === "number" && body.durationMs > 0 ? body.durationMs : undefined;

  if (alias === admin.alias) {
    return NextResponse.json({ error: "No puedes banearte a ti mismo." }, { status: 400 });
  }

  const user = await setUserBanned(alias, banned, durationMs);
  if (!user) return NextResponse.json({ error: "No existe una cuenta con ese nombre de usuario." }, { status: 404 });

  return NextResponse.json({ user });
}
