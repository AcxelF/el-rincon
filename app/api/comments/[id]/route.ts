import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteComment } from "@/lib/posts";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await params;
  await deleteComment(Number(id));
  return NextResponse.json({ ok: true });
}
