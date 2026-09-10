import { NextRequest, NextResponse } from "next/server";
import { findUserByAlias, getUserCreatedAt, normalizeAlias } from "@/lib/auth";
import { commentsAuthoredBy, getRanking, karmaFor } from "@/lib/posts";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatMemberSince(sqlDatetime: string): string {
  const date = new Date(sqlDatetime.replace(" ", "T") + "Z");
  return `${MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

export async function GET(request: NextRequest) {
  const alias = normalizeAlias(request.nextUrl.searchParams.get("alias") || "");
  if (!alias) return NextResponse.json({ error: "Falta el nombre de usuario." }, { status: 400 });

  const user = await findUserByAlias(alias);
  if (!user) return NextResponse.json({ karma: 0, commentCount: 0, rank: 0, memberSince: null });

  const [karma, commentCount, ranking, createdAt] = await Promise.all([
    karmaFor(user.id),
    commentsAuthoredBy(user.id),
    getRanking(100000),
    getUserCreatedAt(alias),
  ]);
  const rank = ranking.findIndex((r) => r.alias.toLowerCase() === alias.toLowerCase()) + 1;
  return NextResponse.json({ karma, commentCount, rank, memberSince: createdAt ? formatMemberSince(createdAt) : null });
}
