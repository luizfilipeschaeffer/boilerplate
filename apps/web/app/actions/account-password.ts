"use server";

import {
  completeTenantMission,
  findUserByEmailForAuth,
  setUserPassword,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { requireTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";

export async function setAccountPassword(
  newPassword: string,
  confirmPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "Não autenticado." };
  }

  if (newPassword.length < 8) {
    return { ok: false, error: "Use pelo menos 8 caracteres na senha." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "As senhas não coincidem." };
  }

  const existing = await findUserByEmailForAuth(email);
  if (existing?.passwordHash) {
    return {
      ok: false,
      error: "Você já definiu uma senha. Use “Esqueci minha senha” no login para alterá-la.",
    };
  }

  const { schemaName, organizationId } = await requireTenantContext();

  await setUserPassword(email, newPassword);

  await completeTenantMission({
    schemaName,
    organizationId,
    missionId: "criar_senha",
    source: "auto",
  });

  revalidatePath("/dashboard");
  revalidatePath("/conta/senha");

  return { ok: true };
}
