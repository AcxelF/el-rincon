import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPost, toggleLike } from "@/lib/posts";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`like:${user.id}`, 60, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás reaccionando demasiado rápido. Espera un momento." }, { status: 429 });

  const { id } = await params;
  await toggleLike(Number(id), user.id);
  const post = await getPost(Number(id), user.id);
  return NextResponse.json({ post });
}
