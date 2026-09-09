import { NextRequest, NextResponse } from "next/server";
import { findUserByAlias, getUserFromRequest, normalizeAlias } from "@/lib/auth";
import { createPost, listPosts, listPostsByAuthor } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const viewer = await getUserFromRequest(request);
  const authorAlias = request.nextUrl.searchParams.get("author");

  if (authorAlias) {
    const author = await findUserByAlias(normalizeAlias(authorAlias));
    if (!author) return NextResponse.json({ posts: [] });
    const includeAnon = !!viewer && viewer.id === author.id;
    return NextResponse.json({ posts: await listPostsByAuthor(author.id, viewer?.id ?? null, includeAnon) });
  }

  return NextResponse.json({ posts: await listPosts(viewer?.id ?? null) });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (user.isMuted) return NextResponse.json({ error: "Estás silenciado y no puedes publicar." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "El texto no puede estar vacío." }, { status: 400 });

  const cat = typeof body?.cat === "string" && body.cat ? body.cat : "Vida de campus";
  const anon = !!body?.anon;
  const isQuestion = !!body?.isQuestion;
  const pollOptions = Array.isArray(body?.pollOptions) ? body.pollOptions.filter((o: unknown) => typeof o === "string") : undefined;

  const postId = await createPost({ userId: user.id, alias: user.alias, anon, cat, text, pollOptions, isQuestion });
  return NextResponse.json({ id: postId });
}
