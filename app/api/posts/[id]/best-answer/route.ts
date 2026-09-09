import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPost, getPostOwnerUserId, toggleBestAnswer } from "@/lib/posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const postId = Number(id);
  const ownerId = await getPostOwnerUserId(postId);
  if (!user.isAdmin && ownerId !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const commentId = typeof body?.commentId === "number" ? body.commentId : null;
  if (!commentId) return NextResponse.json({ error: "Comentario inválido." }, { status: 400 });

  await toggleBestAnswer(postId, commentId);
  const post = await getPost(postId, user.id);
  return NextResponse.json({ post });
}
