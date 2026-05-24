export type IntegratorImplementationStatus =
  | "implemented"
  | "scaffold"
  | "planned";

export type PlatformIntegratorCatalogRow = {
  id: string;
  label: string;
  tipo: string;
  provider: string | null;
  description: string | null;
  implementationStatus: IntegratorImplementationStatus;
  modulosSuportados: string[];
  packagePath: string | null;
  deliveryMarco: string | null;
  ordem: number;
};

export type PlatformCatalogGatewaySeed = {
  isDefault?: boolean;
  configSchema?: Record<string, unknown>;
  ativo?: boolean;
};

export type PlatformCatalogIntegratorSeed = {
  id: string;
  label: string;
  tipo: string;
  provider?: string;
  description?: string;
  implementationStatus: IntegratorImplementationStatus;
  modulosSuportados?: string[];
  packagePath?: string;
  deliveryMarco?: string | null;
  ordem?: number;
  gateway?: PlatformCatalogGatewaySeed;
  configSchema?: Record<string, unknown>;
};
