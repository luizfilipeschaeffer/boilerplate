export type LicenseStatus = "active" | "past_due" | "expired" | "suspended";

export interface LicenseLimits {
  users: number;
  branches: number;
  modules: number;
  organizations: number;
}

export interface LicensePayload {
  organizationId: string;
  installationId: string;
  plan: string;
  status: LicenseStatus;
  expiresAt: string;
  entitlements: string[];
  limits: LicenseLimits;
  signature: string;
  issuedAt: string;
  offlineGraceHours: number;
  allowedOrigins?: string[];
}

export type LicenseBlockedAction =
  | "module.install"
  | "module.paid.write"
  | "update.premium"
  | "support.premium";

export const LICENSE_ALWAYS_ALLOWED = [
  "data.read",
  "data.export",
  "auth.login",
] as const;

export function isLicenseExpired(payload: LicensePayload): boolean {
  if (payload.status === "expired" || payload.status === "suspended") {
    return true;
  }
  return new Date(payload.expiresAt).getTime() < Date.now();
}

export function canPerformLicensedAction(
  payload: LicensePayload,
  action: LicenseBlockedAction,
): boolean {
  if (!isLicenseExpired(payload)) return true;
  return false;
}
