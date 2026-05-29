export interface CentralAccountSession {
  userId: string;
  customerAccountId: string;
  billingOrganizationId: string;
  installationId?: string;
  entitlements: string[];
}

export type DeploymentMode = "cloud" | "self_hosted";

export function resolveDeploymentMode(): DeploymentMode {
  const mode = process.env.DEPLOYMENT_MODE?.trim().toLowerCase();
  return mode === "self_hosted" ? "self_hosted" : "cloud";
}

export type AuthMode = "central" | "legacy";

export function resolveAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE?.trim().toLowerCase();
  return mode === "central" ? "central" : "legacy";
}
