import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { addComment, getPost, listComments } from "@/lib/posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (user.isMuted) return NextResponse.json({ error: "Estás silenciado y no puedes comentar." }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "El comentario no puede estar vacío." }, { status: 400 });

  await addComment(Number(id), { userId: user.id, alias: user.alias, anon: !!body?.anon, text });
  const post = await getPost(Number(id), user.id);
  const comments = await listComments(Number(id), user.id);
  return NextResponse.json({ post, comments });
}
