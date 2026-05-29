export type ReleaseTargetType = "platform" | "module" | "integrator";

export interface Release {
  id: string;
  targetType: ReleaseTargetType;
  targetId: string;
  version: string;
  compatibility: {
    minPlatformVersion: string;
    maxPlatformVersion?: string;
    sdkContractVersion: string;
  };
  changelog: string;
  migrations: string[];
  publishedBy: string;
  publishedAt: Date;
}
