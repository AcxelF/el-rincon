import { NextRequest, NextResponse } from "next/server";
import { normalizeAlias, requireAdmin, setUserMuted } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const muted = !!body?.muted;
  const durationMs = typeof body?.durationMs === "number" && body.durationMs > 0 ? body.durationMs : undefined;

  if (alias === admin.alias) {
    return NextResponse.json({ error: "No puedes silenciarte a ti mismo." }, { status: 400 });
  }

  const user = await setUserMuted(alias, muted, durationMs);
  if (!user) return NextResponse.json({ error: "No existe una cuenta con ese nombre de usuario." }, { status: 404 });

  return NextResponse.json({ user });
}
