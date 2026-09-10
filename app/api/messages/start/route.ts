import { NextRequest, NextResponse } from "next/server";
import { findUserByAlias, getUserFromRequest, normalizeAlias } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messages";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  const other = await findUserByAlias(alias);
  if (!other) return NextResponse.json({ error: "No existe una cuenta con ese nombre de usuario." }, { status: 404 });
  if (other.id === user.id) return NextResponse.json({ error: "No puedes enviarte un mensaje a ti mismo." }, { status: 400 });

  const id = await getOrCreateConversation(user.id, other.id);
  return NextResponse.json({ id, alias: other.alias });
}
