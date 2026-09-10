import { NextRequest, NextResponse } from "next/server";
import {
  findUserByAlias,
  getAliasChangeCooldownRemaining,
  getUserFromRequest,
  isValidAlias,
  isValidBio,
  normalizeAlias,
  updateUserAlias,
  updateUserBio,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { renameAuthorEverywhere } from "@/lib/posts";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  return NextResponse.json({ user: user ?? null });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const allowed = await checkRateLimit(`edit-profile:${user.id}`, 10, 10 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Estás editando tu perfil demasiado rápido. Espera un momento." }, { status: 429 });

  const body = await request.json().catch(() => null);
  let nextAlias = user.alias;
  let nextBio = user.bio;

  if (typeof body?.alias === "string") {
    const alias = normalizeAlias(body.alias);
    if (!isValidAlias(alias)) {
      return NextResponse.json({ error: "El nombre de usuario debe tener 3 a 24 caracteres: letras, números, puntos o guiones bajos." }, { status: 400 });
    }
    if (alias !== user.alias) {
      const cooldownRemaining = await getAliasChangeCooldownRemaining(user.id);
      if (cooldownRemaining > 0) {
        const days = Math.ceil(cooldownRemaining / (24 * 60 * 60 * 1000));
        return NextResponse.json(
          { error: `Solo puedes cambiar tu nombre de usuario una vez cada 7 días. Podrás cambiarlo de nuevo en ${days} ${days === 1 ? "día" : "días"}.` },
          { status: 429 }
        );
      }
      const existing = await findUserByAlias(alias);
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Ese nombre de usuario ya está en uso." }, { status: 409 });
      }
      await updateUserAlias(user.id, alias);
      await renameAuthorEverywhere(user.id, alias);
    }
    nextAlias = alias;
  }

  if (typeof body?.bio === "string") {
    if (!isValidBio(body.bio)) {
      return NextResponse.json({ error: "La descripción no puede superar los 160 caracteres." }, { status: 400 });
    }
    await updateUserBio(user.id, body.bio);
    nextBio = body.bio.trim() || null;
  }

  return NextResponse.json({ user: { ...user, alias: nextAlias, bio: nextBio } });
}
