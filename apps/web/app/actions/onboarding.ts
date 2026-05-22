"use server";

import {
  sugerirAutomacoesIniciais,
  type AprendizPerfilCadastro,
} from "@boilerplate/aprendiz-engine";
import { auth } from "@/auth";
import {
  completeOnboarding,
  completeTenantMission,
  deleteSignupDraft,
  findOrCreateUserByEmail,
  saveAprendizPerfilCadastro,
  setAprendizAutomation,
  setUserPassword,
  type DiagnosticoInput,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";
import { buildPerfilCadastro } from "@/lib/aprendiz/build-perfil-cadastro";
import { ensureModulesRegistered } from "@/lib/modules/init";

export type OnboardingSubmitInput = DiagnosticoInput & {
  name: string;
  email: string;
  organizationName: string;
  /** Opcional — primeiro acesso pode ser só com código no login. */
  password?: string;
};

export async function submitOnboarding(
  input: OnboardingSubmitInput,
): Promise<{
  ok: true;
  requiresPaymentValidation: boolean;
  provisioningStatus: string;
}> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado");
  }

  const email = input.email.trim().toLowerCase();
  const sessionEmail = session.user.email?.trim().toLowerCase();
  if (sessionEmail && sessionEmail !== email) {
    throw new Error("E-mail não confere com a sessão. Saia e entre novamente.");
  }

  const user = await findOrCreateUserByEmail(email, input.name.trim());

  const plainPassword = input.password?.trim() ?? "";

  ensureModulesRegistered();
  const onboarding = await completeOnboarding(user.id, input, {
    marketSegmentSlug: input.segmentoAtuacao ?? "varejo",
    declaredPhase: input.declaredPhase ?? undefined,
  });

  if (plainPassword.length >= 8) {
    await setUserPassword(email, plainPassword);
    await completeTenantMission({
      schemaName: onboarding.schemaName,
      organizationId: onboarding.organizationId,
      missionId: "criar_senha",
      source: "auto",
    });
  }

  const perfil: AprendizPerfilCadastro = buildPerfilCadastro(
    { ...input, origem: "onboarding" },
    onboarding.fase,
  );
  await saveAprendizPerfilCadastro(onboarding.schemaName, { ...perfil });

  const automacoesAtivas = sugerirAutomacoesIniciais(perfil);
  for (const templateId of automacoesAtivas) {
    await setAprendizAutomation(onboarding.schemaName, templateId, true);
  }

  await deleteSignupDraft(input.email);

  revalidatePath("/dashboard");

  return {
    ok: true,
    requiresPaymentValidation: onboarding.requiresPaymentValidation,
    provisioningStatus: onboarding.provisioningStatus,
  };
}
