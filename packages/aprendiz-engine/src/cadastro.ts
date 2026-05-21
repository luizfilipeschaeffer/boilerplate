import type { TipoNegocio } from "@boilerplate/shared";

/** Perfil aprendido no primeiro contato (cadastro). */
export interface AprendizPerfilCadastro {
  ownerName: string;
  ownerEmail: string;
  organizationName: string;
  tipoNegocio: TipoNegocio;
  temPontoFixo: boolean;
  vendasMes: "ate50" | "50a200" | "200a1000" | "acima1000";
  temFuncionarios: boolean;
  possuiCnpj: boolean;
  cnpj?: string | null;
  emiteNota: boolean | null;
  fase: number;
  origem: "cadastro" | "onboarding";
  aprendidoEm: string;
}

export function resumirAprendizado(perfil: AprendizPerfilCadastro): string[] {
  const linhas: string[] = [
    `${perfil.ownerName} lidera “${perfil.organizationName}”.`,
    `Negócio: ${perfil.tipoNegocio.replace(/_/g, " ")} · fase ${perfil.fase}.`,
  ];
  if (perfil.temPontoFixo) linhas.push("Tem ponto fixo (loja, escritório ou similar).");
  if (perfil.temFuncionarios) linhas.push("Trabalha com funcionários ou colaboradores fixos.");
  if (perfil.possuiCnpj) linhas.push("Já possui CNPJ.");
  else linhas.push("Ainda sem CNPJ.");
  if (perfil.emiteNota === true) linhas.push("Já emite nota fiscal.");
  else if (perfil.emiteNota === false) linhas.push("Ainda não emite nota fiscal.");
  else linhas.push("Situação fiscal em definição.");
  return linhas;
}

/** Automações sugeridas com base no que o Aprendiz aprendeu no cadastro. */
export function sugerirAutomacoesIniciais(
  perfil: AprendizPerfilCadastro,
): string[] {
  const ids = new Set<string>(["venda-desconta-estoque"]);
  if (perfil.vendasMes !== "ate50" || perfil.fase >= 2) {
    ids.add("estoque-baixo");
  }
  return [...ids];
}
