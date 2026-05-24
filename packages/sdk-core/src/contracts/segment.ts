import type { OrgBootContext } from "./org-context";

export interface OrgHierarchyConfig {
  defaultBranches?: number;
  departmentsPerBranch?: number;
  teamsPerDepartment?: number;
  enableFranchiseMode?: boolean;
}

export type SegmentSeedFn = (ctx: OrgBootContext) => Promise<void>;

export interface BoilerplateSegment {
  id: string;
  version: string;
  name: string;
  requiredModules: string[];
  recommendedIntegrators: string[];
  hierarchyConfig?: OrgHierarchyConfig;
  seedData?: SegmentSeedFn;
}
