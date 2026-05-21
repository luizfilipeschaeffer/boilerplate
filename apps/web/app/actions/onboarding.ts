"use server";

import {
  sugerirAutomacoesIniciais,
  type AprendizPerfilCadastro,
} from "@boilerplate/aprendiz-engine";
import { auth } from "@/auth";
import {
  completeOnboarding,
  deleteSignupDraft,
  findOrCreateUserByEmail,
  saveAprendizPerfilCadastro,
  setAprendizAutomation,
  type DiagnosticoInput,
} from "@boilerplate/db";
import { buildPerfilCadastro } from "@/lib/aprendiz/build-perfil-cadastro";
import { ensureModulesRegistered } from "@/lib/modules/init";

export type OnboardingSubmitInput = DiagnosticoInput & {
  name: string;
  email: string;
  organizationName: string;
};

export async function submitOnboarding(
  input: OnboardingSubmitInput,
): Promise<{ ok: true }> {
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

  ensureModulesRegistered();
  const onboarding = await completeOnboarding(user.id, input);

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
  return { ok: true };
}
