import { NextResponse } from "next/server";
import { getRanking } from "@/lib/posts";

export async function GET() {
  return NextResponse.json({ ranking: await getRanking() });
}
