import { createHash, randomBytes } from "node:crypto";
import { encryptEnvelope, decryptEnvelope } from "@boilerplate/shared/secrets";

export function hashInstallationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashInstallationKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateSecureToken(prefix: string): string {
  return `${prefix}_${randomBytes(24).toString("base64url")}`;
}

export function encryptInstallationSecrets(secrets: Record<string, string>): string {
  return encryptEnvelope(secrets);
}

export function decryptInstallationSecrets(encrypted: string): Record<string, string> {
  return decryptEnvelope(encrypted) as Record<string, string>;
}
