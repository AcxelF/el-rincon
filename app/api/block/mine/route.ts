import { NextRequest, NextResponse } from "next/server";
import { getBlockedAliases, getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ blocked: [] });
  return NextResponse.json({ blocked: await getBlockedAliases(user.id) });
}
