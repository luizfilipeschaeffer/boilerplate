"use server";

import { auth } from "@/auth";
import { completeOnboarding, type DiagnosticoInput } from "@boilerplate/db";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { redirect } from "next/navigation";

export async function submitOnboarding(
  input: DiagnosticoInput & { organizationName: string },
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  ensureModulesRegistered();
  await completeOnboarding(session.user.id, input);
  redirect("/dashboard");
}
