import { NextRequest, NextResponse } from "next/server";
import { findUserByAlias, normalizeAlias } from "@/lib/auth";
import { commentsAuthoredBy, getRanking, karmaFor } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const alias = normalizeAlias(request.nextUrl.searchParams.get("alias") || "");
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  const user = await findUserByAlias(alias);
  if (!user) return NextResponse.json({ karma: 0, commentCount: 0, rank: 0 });

  const [karma, commentCount, ranking] = await Promise.all([karmaFor(user.id), commentsAuthoredBy(user.id), getRanking(100000)]);
  const rank = ranking.findIndex((r) => r.alias.toLowerCase() === alias.toLowerCase()) + 1;
  return NextResponse.json({ karma, commentCount, rank });
}
