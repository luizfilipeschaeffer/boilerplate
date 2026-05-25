import type { OrgBootContext } from "./org-context";
import type { EventHandlerRegistration } from "./events";
import type { Permission } from "./permissions";

export interface ModuleCapabilities {
  database?: boolean;
  storage?: boolean;
  queues?: boolean;
  webhooks?: boolean;
  billing?: boolean;
  ai?: boolean;
  externalHttp?: boolean;
  filesystem?: false;
  processEnv?: false;
  crossTenant?: false;
}

export interface ModuleRoute {
  path: string;
  label: string;
  permission?: Permission;
  layout?: "dashboard" | "settings" | "modal";
}

export type ModuleMigrationFn = (ctx: {
  schemaName: string;
  organizationId: string;
  fromVersion: string;
  toVersion: string;
}) => Promise<void>;

export interface BoilerplateModule {
  id: string;
  version: string;
  coreContract: string;
  segment?: string[];
  capabilities: ModuleCapabilities;
  requiredPermissions: Permission[];
  routes: ModuleRoute[];
  eventHandlers?: EventHandlerRegistration[];
  migrations?: ModuleMigrationFn[];
  onInstall?: (orgId: string, context: OrgBootContext) => Promise<void>;
  onUninstall?: (orgId: string) => Promise<void>;
}

export type ModuleTableDef = {
  name: string;
  description?: string;
};
