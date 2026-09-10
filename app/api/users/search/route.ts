import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, searchUsersByAlias } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ users: [] });

  const q = request.nextUrl.searchParams.get("q") || "";
  return NextResponse.json({ users: await searchUsersByAlias(q) });
}
