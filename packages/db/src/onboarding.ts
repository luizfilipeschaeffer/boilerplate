import {
  classificarFase,
  modulosDemanda,
  modulosParaAtivar,
  recomendarModulos,
  type DiagnosticoInput,
} from "@boilerplate/module-registry";
import { validateModuleActivation } from "@boilerplate/module-registry";
import { prisma } from "./client";
import {
  createOrganizationWithTenant,
  getMembershipForUser,
  registerModuloDemanda,
  resolveUniqueOrganizationSlug,
  setOrganizationModules,
} from "./organization";

export type { DiagnosticoInput };

export async function completeOnboarding(
  userId: string,
  input: DiagnosticoInput & { organizationName: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Usuário não encontrado. Saia e entre novamente.");
  }

  const existing = await getMembershipForUser(userId);
  if (existing) {
    throw new Error("Usuário já concluiu o onboarding");
  }

  const fase = classificarFase(input);
  const recomendacoes = recomendarModulos(fase, input.tipoNegocio, {
    possuiCnpj: input.possuiCnpj,
  });

  const slug = await resolveUniqueOrganizationSlug(input.organizationName);

  const org = await createOrganizationWithTenant(
    {
      name: input.organizationName,
      slug,
      tipoNegocio: input.tipoNegocio,
      phase: fase,
      segmentoAtuacao: input.segmentoAtuacao,
      hasCnpj: input.possuiCnpj,
      cnpj: input.cnpj,
      fiscalReady: input.possuiCnpj && (input.emiteNota ?? false),
    },
    userId,
  );

  const toActivate = modulosParaAtivar(recomendacoes);
  const resolved = new Set<string>();

  for (const moduleId of toActivate) {
    const next = await expandModuleActivation(moduleId, [...resolved]);
    for (const id of next) resolved.add(id);
  }

  await setOrganizationModules(org.id, [...resolved]);
  await registerModuloDemanda(org.id, modulosDemanda(recomendacoes));

  return {
    organizationId: org.id,
    schemaName: org.schemaName,
    sectorId: "geral",
    fase,
    modulosAtivos: [...resolved],
    recomendacoes,
  };
}

async function expandModuleActivation(
  moduleId: string,
  current: string[],
): Promise<string[]> {
  const modulo = await validateModuleActivation(moduleId, current);
  const next = new Set(current);
  next.add(modulo.id);
  if (modulo.parentModuleId) next.add(modulo.parentModuleId);
  return [...next];
}
