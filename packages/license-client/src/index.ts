import { createVerify } from "node:crypto";
import type { LicensePayload, LicenseBlockedAction } from "@boilerplate/platform-api";
import {
  isLicenseExpired,
  canPerformLicensedAction,
  LICENSE_ALWAYS_ALLOWED,
} from "@boilerplate/platform-api";
import { PlatformApiClient } from "@boilerplate/platform-api/client";
import { loadLicenseCache, saveLicenseCache } from "@boilerplate/db/self-hosted";

export function verifyLicenseSignature(payload: LicensePayload): boolean {
  const key = process.env.LICENSE_SIGNING_KEY ?? "dev-license-signing-key-change-me";
  const { signature, ...rest } = payload;
  const verify = createVerify("SHA256");
  verify.update(JSON.stringify(rest));
  verify.end();
  return verify.verify(key, signature, "base64");
}

export async function fetchAndCacheLicense(opts: {
  centralApiUrl: string;
  installationId: string;
  installationKey: string;
}): Promise<LicensePayload> {
  const client = new PlatformApiClient({
    baseUrl: opts.centralApiUrl,
    installationKey: opts.installationKey,
  });
  const payload = await client.getLicense(opts.installationId);
  if (!verifyLicenseSignature(payload)) {
    throw new Error("INVALID_LICENSE_SIGNATURE");
  }
  const validUntil = new Date(
    Date.now() + payload.offlineGraceHours * 60 * 60 * 1000,
  );
  await saveLicenseCache({
    payloadJson: JSON.stringify(payload),
    signature: payload.signature,
    expiresAt: new Date(payload.expiresAt),
    validUntil,
  });
  return payload;
}

export async function getEffectiveLicense(): Promise<LicensePayload | null> {
  const cached = await loadLicenseCache();
  if (!cached) return null;
  const payload = JSON.parse(cached.payloadJson) as LicensePayload;
  if (!verifyLicenseSignature(payload)) return null;
  if (cached.validUntil.getTime() < Date.now()) return null;
  return payload;
}

export function checkEntitlement(
  payload: LicensePayload | null,
  entitlement: string,
): boolean {
  if (!payload) return false;
  return payload.entitlements.includes(entitlement);
}

export function gateLicensedAction(
  payload: LicensePayload | null,
  action: LicenseBlockedAction | (typeof LICENSE_ALWAYS_ALLOWED)[number],
): boolean {
  if ((LICENSE_ALWAYS_ALLOWED as readonly string[]).includes(action)) return true;
  if (!payload) return false;
  return canPerformLicensedAction(payload, action as LicenseBlockedAction);
}

export { isLicenseExpired, LICENSE_ALWAYS_ALLOWED };
