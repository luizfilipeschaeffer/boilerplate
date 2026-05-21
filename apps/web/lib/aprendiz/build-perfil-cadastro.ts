import type { AprendizPerfilCadastro } from "@boilerplate/aprendiz-engine";
import type { DiagnosticoInput } from "@boilerplate/db";

export type PerfilCadastroInput = DiagnosticoInput & {
  name: string;
  email: string;
  organizationName: string;
  origem?: "cadastro" | "onboarding";
};

export function buildPerfilCadastro(
  input: PerfilCadastroInput,
  fase: number,
): AprendizPerfilCadastro {
  return {
    ownerName: input.name,
    ownerEmail: input.email,
    organizationName: input.organizationName,
    tipoNegocio: input.tipoNegocio,
    temPontoFixo: input.temPontoFixo,
    vendasMes: input.vendasMes,
    temFuncionarios: input.temFuncionarios,
    possuiCnpj: input.possuiCnpj,
    cnpj: input.cnpj,
    emiteNota: input.emiteNota,
    fase,
    origem: input.origem ?? "cadastro",
    aprendidoEm: new Date().toISOString(),
  };
}
