import { NextResponse } from "next/server";
import { getBadgeMap } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ badges: await getBadgeMap() });
}
