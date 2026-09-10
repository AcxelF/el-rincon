import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { isParticipant, listMessages, markConversationRead, sendMessage } from "@/lib/messages";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const conversationId = Number(id);
  if (!(await isParticipant(conversationId, user.id))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await markConversationRead(conversationId, user.id);
  return NextResponse.json({ messages: await listMessages(conversationId, user.id) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const conversationId = Number(id);
  if (!(await isParticipant(conversationId, user.id))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const allowed = await checkRateLimit(`send-message:${user.id}`, 30, 5 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás enviando mensajes demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });

  await sendMessage(conversationId, user.id, text);
  return NextResponse.json({ messages: await listMessages(conversationId, user.id) });
}
