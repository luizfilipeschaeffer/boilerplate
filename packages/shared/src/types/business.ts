export type Fase = 1 | 2 | 3 | 4;

export type TipoNegocio =
  | "pessoa_fisica"
  | "varejo"
  | "atacado"
  | "fornecedor"
  | "distribuidor"
  | "transportadora"
  | "fabricante"
  | "industria"
  | "produtor_rural";

export type FiscalCapability =
  | "nfce"
  | "nfe"
  | "cte"
  | "mdfe"
  | "ciot"
  | "sped"
  | "rural"
  | "nfse";

export type ImplementationStatus = "scaffold" | "implemented" | "deprecated";
