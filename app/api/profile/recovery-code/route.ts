import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, setRecoveryCode } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const allowed = await checkRateLimit(`recovery-code:${user.id}`, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });

  const code = await setRecoveryCode(user.id);
  return NextResponse.json({ code });
}
