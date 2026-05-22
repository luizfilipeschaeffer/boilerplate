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

export type DeliveryMarco = "R0" | "R1" | "R2" | "R3" | "R4";

export type CoreSectorSlug =
  | "comercial"
  | "operacao"
  | "financeiro"
  | "fiscal"
  | "analytics"
  | "pessoas"
  | "logistica"
  | "atendimento"
  | "tecnologia"
  | "compliance";
