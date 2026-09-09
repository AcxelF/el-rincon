import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { listNotifications, markAllNotificationsRead } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ notifications: [] });
  return NextResponse.json({ notifications: await listNotifications(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
