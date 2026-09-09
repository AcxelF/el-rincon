import { NextRequest, NextResponse } from "next/server";
import { listUsers, requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  return NextResponse.json({ users: await listUsers() });
}
