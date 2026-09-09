import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPost, votePoll } from "@/lib/posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const optionId = typeof body?.optionId === "number" ? body.optionId : null;
  if (!optionId) return NextResponse.json({ error: "Opción inválida." }, { status: 400 });

  await votePoll(Number(id), user.id, optionId);
  const post = await getPost(Number(id), user.id);
  return NextResponse.json({ post });
}
