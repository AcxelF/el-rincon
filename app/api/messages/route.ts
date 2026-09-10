import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { listConversationsForUser } from "@/lib/messages";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ conversations: [] });
  return NextResponse.json({ conversations: await listConversationsForUser(user.id) });
}
