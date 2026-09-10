import { NextRequest, NextResponse } from "next/server";
import { followUser, getFollowStats, getUserFromRequest, normalizeAlias, unfollowUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const alias = normalizeAlias(request.nextUrl.searchParams.get("alias") || "");
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  const viewer = await getUserFromRequest(request);
  return NextResponse.json(await getFollowStats(alias, viewer?.id));
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`follow:${user.id}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás siguiendo/dejando de seguir demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const alias = normalizeAlias(typeof body?.alias === "string" ? body.alias : "");
  const follow = !!body?.follow;
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  if (follow) {
    const result = await followUser(user.id, alias);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  } else {
    await unfollowUser(user.id, alias);
  }

  return NextResponse.json(await getFollowStats(alias, user.id));
}
