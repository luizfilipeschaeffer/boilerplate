export type InstallationStatus = "pending" | "active" | "suspended" | "revoked";

export interface SelfHostedInstallation {
  id: string;
  organizationId: string;
  name: string;
  installationKey: string;
  publicUrl?: string;
  status: InstallationStatus;
  version: string;
  lastHeartbeatAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallationHeartbeatPayload {
  installationId: string;
  platformVersion: string;
  installedModules: { id: string; version: string }[];
  installedIntegrators: { id: string; version: string }[];
  databaseVersion: string;
  dockerImageVersion: string;
  healthStatus: "healthy" | "degraded" | "unhealthy";
  lastMigrationStatus: "ok" | "failed" | "pending";
  orgCount: number;
  activeUserCount: number;
}

export interface RegisterInstallationRequest {
  installationToken: string;
  publicUrl?: string;
  platformVersion: string;
  dockerImageVersion: string;
}

export interface RegisterInstallationResponse {
  installationId: string;
  installationKey: string;
  organizationId: string;
  oauthClientId: string;
  oauthClientSecret: string;
}
