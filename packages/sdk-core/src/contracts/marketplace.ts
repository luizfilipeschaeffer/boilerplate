import type { ModuleCapabilities } from "./module";
import type { SupportsContract } from "./versioning";

export type TrustLevel = "community" | "verified" | "certified" | "official";

export interface PublisherIdentity {
  did: string;
  publicKey: string;
  displayName: string;
  verifiedAt?: string;
}

export interface ModuleManifest {
  id: string;
  version: string;
  signature: string;
  publisherDID: string;
  capabilities: ModuleCapabilities;
  permissions: string[];
  supportedCoreVersions: string[];
  supportsContract: SupportsContract;
  trustLevel: TrustLevel;
  auditReport?: string;
  npmPackage: string;
  checksum: string;
  publishedAt?: string;
}

export interface IntegratorManifest extends Omit<ModuleManifest, "capabilities"> {
  category: string;
  configSchemaKeys: string[];
  capabilities: {
    webhooks?: boolean;
    externalHttp?: boolean;
    storage?: boolean;
  };
}
