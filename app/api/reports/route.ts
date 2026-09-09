import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { listReports, reportComment, reportPost } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  return NextResponse.json({ reports: await listReports() });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const kind = body?.kind === "comment" ? "comment" : body?.kind === "post" ? "post" : null;
  const postId = typeof body?.postId === "number" ? body.postId : null;
  const commentId = typeof body?.commentId === "number" ? body.commentId : undefined;
  if (!kind || !postId) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  if (kind === "post") {
    await reportPost(postId);
  } else {
    if (!commentId) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    await reportComment(postId, commentId);
  }
  return NextResponse.json({ ok: true });
}
