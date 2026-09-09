import { NextResponse } from "next/server";
import { getBioMap } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ bios: await getBioMap() });
}
