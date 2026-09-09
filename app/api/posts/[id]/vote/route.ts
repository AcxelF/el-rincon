import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPost, toggleVote } from "@/lib/posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const dir = body?.dir === 1 || body?.dir === -1 ? body.dir : null;
  if (!dir) return NextResponse.json({ error: "Dirección de voto inválida." }, { status: 400 });

  await toggleVote(Number(id), user.id, dir);
  const post = await getPost(Number(id), user.id);
  return NextResponse.json({ post });
}
