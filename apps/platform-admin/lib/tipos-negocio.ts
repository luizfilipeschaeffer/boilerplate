import type { TipoNegocio } from "@boilerplate/shared";

export const TIPOS_NEGOCIO: { value: TipoNegocio; label: string }[] = [
  { value: "pessoa_fisica", label: "Pessoa física / autônomo" },
  { value: "varejo", label: "Varejo" },
  { value: "atacado", label: "Atacado" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "transportadora", label: "Transportadora" },
  { value: "fabricante", label: "Fabricante" },
  { value: "industria", label: "Indústria" },
  { value: "produtor_rural", label: "Produtor rural" },
];

export function formatTipoNegocio(value: string): string {
  return TIPOS_NEGOCIO.find((t) => t.value === value)?.label ?? value;
}
