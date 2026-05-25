import { createVerify } from "node:crypto";
import type { ModuleManifest } from "@boilerplate/sdk-core";

export function verifyManifestSignature(
  manifest: Omit<ModuleManifest, "signature">,
  signature: string,
  publicKeyPem: string,
): boolean {
  const verify = createVerify("SHA256");
  verify.update(JSON.stringify(manifest));
  verify.end();
  return verify.verify(publicKeyPem, Buffer.from(signature, "base64"));
}

export type InstallValidationResult =
  | { ok: true; manifest: ModuleManifest }
  | { ok: false; code: string; message: string };

export function validateInstallManifest(manifest: ModuleManifest): InstallValidationResult {
  if (!manifest.signature) {
    return { ok: false, code: "MISSING_SIGNATURE", message: "Manifest must be signed" };
  }
  if (manifest.trustLevel === "community" && !manifest.supportedCoreVersions.length) {
    return { ok: false, code: "MISSING_CORE_VERSION", message: "supportedCoreVersions required" };
  }
  return { ok: true, manifest };
}
