import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { deletePost, getPost, getPostOwnerUserId, listComments, updatePost } from "@/lib/posts";
import { checkRateLimit } from "@/lib/rate-limit";
import { CATEGORIES } from "@/lib/mock-data";

const VALID_CATEGORY_IDS = new Set(CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id));

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const postId = Number(id);
  const ownerId = await getPostOwnerUserId(postId);
  if (ownerId !== user.id) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const allowed = await checkRateLimit(`edit-post:${user.id}`, 15, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás editando demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "El texto no puede estar vacío." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "El texto no puede superar los 2000 caracteres." }, { status: 400 });

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (title.length > 120) return NextResponse.json({ error: "El título no puede superar los 120 caracteres." }, { status: 400 });

  const catRaw = typeof body?.cat === "string" ? body.cat : undefined;
  const cat = catRaw !== undefined && VALID_CATEGORY_IDS.has(catRaw) ? catRaw : undefined;

  await updatePost(postId, { text, title: title || undefined, cat });
  const post = await getPost(postId, user.id);
  return NextResponse.json({ post });
}
