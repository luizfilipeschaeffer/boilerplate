import type {
  CoreSectorSlug,
  DeliveryMarco,
  FiscalCapability,
  Fase,
  ImplementationStatus,
  TipoNegocio,
} from "./business";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  ordem: number;
  icon?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  faseMinima: Fase;
  dependencias: string[];
  parentModuleId?: string;
  submodulos?: string[];
  fiscalCapability?: FiscalCapability;
  tiposNegocioElegiveis?: TipoNegocio[];
  implementationStatus: ImplementationStatus;
  sectorSlug?: CoreSectorSlug;
  camada?: string;
  depthCurrent?: number;
  depthTarget?: number;
  depthTargetMarco?: DeliveryMarco;
  deliveryMarco?: DeliveryMarco;
  navItems: NavItem[];
  routes: { path: string; label: string }[];
}
