import type {
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
  navItems: NavItem[];
  routes: { path: string; label: string }[];
}
