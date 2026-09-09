import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPost, togglePin } from "@/lib/posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { id } = await params;
  await togglePin(Number(id));
  const post = await getPost(Number(id), admin.id);
  return NextResponse.json({ post });
}
