export type MarketplaceItemType = "module" | "submodule" | "integrator";
export type MarketplaceItemStatus =
  | "experimental"
  | "approved"
  | "recommended"
  | "official"
  | "enterprise";
export type PricingModel = "free" | "subscription" | "usage" | "one_time";

export interface ModuleMigrationEntry {
  id: string;
  checksum: string;
  direction: "up" | "down";
  tenantScoped: boolean;
  requiresBackup: boolean;
}

export interface ModuleMigrationManifest {
  moduleId: string;
  version: string;
  migrations: ModuleMigrationEntry[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
}

export interface MarketplaceModule {
  id: string;
  name: string;
  description: string;
  type: MarketplaceItemType;
  ownerDeveloperId?: string;
  status: MarketplaceItemStatus;
  pricingModel: PricingModel;
  priceMonthlyCents?: number;
  currentVersion: string;
  minimumPlatformVersion: string;
  entitlementsRequired: string[];
  migrations: ModuleMigrationManifest[];
  changelog: ChangelogEntry[];
}
