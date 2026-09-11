import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { deletePost, getPost, getPostOwnerUserId, listComments } from "@/lib/posts";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getUserFromRequest(request);
  const post = await getPost(Number(id), viewer?.id ?? null);
  if (!post) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const comments = await listComments(Number(id), viewer?.id ?? null);
  return NextResponse.json({ post, comments });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const postId = Number(id);
  const ownerId = await getPostOwnerUserId(postId);
  if (!user.isAdmin && ownerId !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await deletePost(postId);
  return NextResponse.json({ ok: true });
}
