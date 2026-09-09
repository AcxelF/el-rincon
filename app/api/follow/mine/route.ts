import { NextRequest, NextResponse } from "next/server";
import { getFollowingAliases, getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ following: [] });
  return NextResponse.json({ following: await getFollowingAliases(user.id) });
}
