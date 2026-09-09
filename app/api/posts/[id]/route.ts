import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getUserFromRequest } from "@/lib/auth";
import { deletePost, getPost, listComments } from "@/lib/posts";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getUserFromRequest(request);
  const post = await getPost(Number(id), viewer?.id ?? null);
  if (!post) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const comments = await listComments(Number(id), viewer?.id ?? null);
  return NextResponse.json({ post, comments });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await params;
  await deletePost(Number(id));
  return NextResponse.json({ ok: true });
}
