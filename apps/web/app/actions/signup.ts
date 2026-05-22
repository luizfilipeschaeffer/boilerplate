"use server";

import {
  sugerirAutomacoesIniciais,
  type AprendizPerfilCadastro,
} from "@boilerplate/aprendiz-engine";
import {
  assertEmailVerifiedForSignup,
  completeOnboarding,
  deleteSignupDraft,
  findOrCreateUserByEmail,
  getMembershipForUser,
  prisma,
  saveAprendizPerfilCadastro,
  setAprendizAutomation,
} from "@boilerplate/db";
import type { DiagnosticoInput } from "@boilerplate/db";
import { buildPerfilCadastro } from "@/lib/aprendiz/build-perfil-cadastro";
import { ensureModulesRegistered } from "@/lib/modules/init";

export type RegisterInput = DiagnosticoInput & {
  name: string;
  email: string;
  organizationName: string;
};

export async function checkSignupEmail(email: string): Promise<{
  canRegister: boolean;
  reason?: "has_organization";
}> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return { canRegister: true };
  const membership = await getMembershipForUser(user.id);
  if (membership) {
    return { canRegister: false, reason: "has_organization" };
  }
  return { canRegister: true };
}

export async function registerAndOnboard(
  input: RegisterInput,
): Promise<{
  email: string;
  automacoesAtivas: string[];
  requiresPaymentValidation: boolean;
  provisioningStatus: string;
}> {
  const email = input.email.trim().toLowerCase();
  const check = await checkSignupEmail(email);
  if (!check.canRegister) {
    throw new Error(
      "Este e-mail já possui uma conta. Use Entrar para acessar o painel.",
    );
  }

  await assertEmailVerifiedForSignup(email);

  const user = await findOrCreateUserByEmail(email, input.name.trim());

  ensureModulesRegistered();
  const onboarding = await completeOnboarding(
    user.id,
    {
      organizationName: input.organizationName,
      tipoNegocio: input.tipoNegocio,
      segmentoAtuacao: input.segmentoAtuacao,
      temPontoFixo: input.temPontoFixo,
      vendasMes: input.vendasMes,
      temFuncionarios: input.temFuncionarios,
      emiteNota: input.emiteNota,
      possuiCnpj: input.possuiCnpj,
      cnpj: input.cnpj,
    },
    {
      marketSegmentSlug: input.segmentoAtuacao ?? "varejo",
      declaredPhase: input.declaredPhase ?? undefined,
    },
  );

  const perfil: AprendizPerfilCadastro = buildPerfilCadastro(
    input,
    onboarding.fase,
  );
  await saveAprendizPerfilCadastro(onboarding.schemaName, { ...perfil });

  const automacoesAtivas = sugerirAutomacoesIniciais(perfil);
  for (const templateId of automacoesAtivas) {
    await setAprendizAutomation(onboarding.schemaName, templateId, true);
  }

  await deleteSignupDraft(email);

  return {
    email,
    automacoesAtivas,
    requiresPaymentValidation: onboarding.requiresPaymentValidation,
    provisioningStatus: onboarding.provisioningStatus,
  };
}
