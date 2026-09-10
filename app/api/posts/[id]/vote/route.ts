import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPost, toggleVote } from "@/lib/posts";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`vote:${user.id}`, 60, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás votando demasiado rápido. Espera un momento." }, { status: 429 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const dir = body?.dir === 1 || body?.dir === -1 ? body.dir : null;
  if (!dir) return NextResponse.json({ error: "Dirección de voto inválida." }, { status: 400 });

  await toggleVote(Number(id), user.id, dir);
  const post = await getPost(Number(id), user.id);
  return NextResponse.json({ post });
}
