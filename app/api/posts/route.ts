import { NextRequest, NextResponse } from "next/server";
import { findUserByAlias, getUserFromRequest, normalizeAlias } from "@/lib/auth";
import { createPost, listPosts, listPostsByAuthor, POSTS_PAGE_SIZE } from "@/lib/posts";
import { checkRateLimit } from "@/lib/rate-limit";
import { CATEGORIES } from "@/lib/mock-data";

const VALID_CATEGORY_IDS = new Set(CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id));

export async function GET(request: NextRequest) {
  const viewer = await getUserFromRequest(request);
  const authorAlias = request.nextUrl.searchParams.get("author");

  if (authorAlias) {
    const author = await findUserByAlias(normalizeAlias(authorAlias));
    if (!author) return NextResponse.json({ posts: [] });
    const includeAnon = !!viewer && viewer.id === author.id;
    return NextResponse.json({ posts: await listPostsByAuthor(author.id, viewer?.id ?? null, includeAnon) });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : POSTS_PAGE_SIZE;
  const { posts, hasMore } = await listPosts(viewer?.id ?? null, limit);
  return NextResponse.json({ posts, hasMore });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (user.isMuted) return NextResponse.json({ error: "Estás silenciado y no puedes publicar." }, { status: 403 });

  const allowed = await checkRateLimit(`create-post:${user.id}`, 5, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás publicando demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "El texto no puede estar vacío." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "El texto no puede superar los 2000 caracteres." }, { status: 400 });

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (title.length > 120) return NextResponse.json({ error: "El título no puede superar los 120 caracteres." }, { status: 400 });

  const requestedCat = typeof body?.cat === "string" ? body.cat : "";
  const cat = VALID_CATEGORY_IDS.has(requestedCat) ? requestedCat : "Vida de campus";
  const anon = !!body?.anon;
  const isQuestion = !!body?.isQuestion;
  const pollOptions = Array.isArray(body?.pollOptions) ? body.pollOptions.filter((o: unknown) => typeof o === "string") : undefined;

  const imageUrlRaw = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  if (imageUrlRaw && !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(imageUrlRaw)) {
    return NextResponse.json({ error: "Imagen inválida." }, { status: 400 });
  }

  const postId = await createPost({
    userId: user.id,
    alias: user.alias,
    anon,
    cat,
    text,
    title: title || undefined,
    imageUrl: imageUrlRaw || undefined,
    pollOptions,
    isQuestion,
  });
  return NextResponse.json({ id: postId });
}
