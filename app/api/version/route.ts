import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let buildId = "dev";
  try {
    buildId = fs.readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    // Local dev without a production build — no update to detect.
  }
  return NextResponse.json({ buildId }, { headers: { "Cache-Control": "no-store" } });
}
