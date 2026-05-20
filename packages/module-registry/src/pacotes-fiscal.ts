import type { TipoNegocio } from "@boilerplate/shared";

export const PACOTES_FISCAL_POR_TIPO: Partial<Record<TipoNegocio, string[]>> = {
  varejo: ["fiscal-nfce", "fiscal-sped"],
  atacado: ["fiscal-nfe", "fiscal-sped"],
  fornecedor: ["fiscal-nfe", "fiscal-sped"],
  distribuidor: ["fiscal-nfe", "fiscal-sped"],
  transportadora: ["fiscal-cte", "fiscal-mdfe", "fiscal-ciot"],
  fabricante: ["fiscal-nfe", "fiscal-sped"],
  industria: ["fiscal-nfe", "fiscal-sped"],
  produtor_rural: ["fiscal-rural", "fiscal-sped"],
};
