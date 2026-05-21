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

export const VENDAS_MES_OPTIONS = [
  { value: "ate50" as const, label: "Até 50 vendas" },
  { value: "50a200" as const, label: "Entre 50 e 200" },
  { value: "200a1000" as const, label: "Entre 200 e 1.000" },
  { value: "acima1000" as const, label: "Mais de 1.000" },
];
