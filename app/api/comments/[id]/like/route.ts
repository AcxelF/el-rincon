import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { toggleCommentLike } from "@/lib/posts";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`comment-like:${user.id}`, 60, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás reaccionando demasiado rápido. Espera un momento." }, { status: 429 });

  const { id } = await params;
  await toggleCommentLike(Number(id), user.id);
  return NextResponse.json({ ok: true });
}
