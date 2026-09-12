import { NextRequest, NextResponse } from "next/server";
import { blockUser, getUserFromRequest, isUserBlocked, normalizeAlias, unblockUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const alias = normalizeAlias(request.nextUrl.searchParams.get("alias") || "");
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ isBlocked: false });
  return NextResponse.json({ isBlocked: await isUserBlocked(user.id, alias) });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`block:${user.id}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás bloqueando/desbloqueando demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const block = !!body?.block;
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  if (block) {
    const result = await blockUser(user.id, alias);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  } else {
    await unblockUser(user.id, alias);
  }

  return NextResponse.json({ isBlocked: block });
}
