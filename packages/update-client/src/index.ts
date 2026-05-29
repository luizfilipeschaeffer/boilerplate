import { PlatformApiClient } from "@boilerplate/platform-api/client";
import { getEffectiveLicense, gateLicensedAction } from "@boilerplate/license-client";

export type UpdateCheckResult = {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  changelog?: string;
};

export async function checkPlatformUpdates(opts: {
  centralApiUrl: string;
  installationKey: string;
  currentVersion: string;
}): Promise<UpdateCheckResult> {
  const license = await getEffectiveLicense();
  if (!gateLicensedAction(license, "update.premium")) {
    return { available: false, currentVersion: opts.currentVersion };
  }
  const client = new PlatformApiClient({
    baseUrl: opts.centralApiUrl,
    installationKey: opts.installationKey,
  });
  const { releases } = await client.listPlatformUpdates();
  const latest = releases[0];
  if (!latest || latest.version === opts.currentVersion) {
    return { available: false, currentVersion: opts.currentVersion };
  }
  return {
    available: true,
    currentVersion: opts.currentVersion,
    latestVersion: latest.version,
    changelog: latest.changelog,
  };
}

export async function applyPlatformUpdate(_opts: {
  targetVersion: string;
  backupConfirmed: boolean;
}): Promise<{ ok: boolean; message: string }> {
  if (!_opts.backupConfirmed) {
    return { ok: false, message: "Backup recomendado antes de atualizar" };
  }
  return {
    ok: true,
    message: `Update para ${_opts.targetVersion} agendado — reinicie os containers após pull da imagem`,
  };
}
