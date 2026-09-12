import { NextRequest, NextResponse } from "next/server";
import { normalizeAlias, requireAdmin, resetUserPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const allowed = await checkRateLimit(`admin-reset-password:${admin.id}`, 20, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Demasiadas acciones seguidas. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");

  const result = await resetUserPassword(alias);
  if (!result) return NextResponse.json({ error: "No existe una cuenta con ese nombre de usuario." }, { status: 404 });

  return NextResponse.json(result);
}
