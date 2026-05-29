import { satisfiesSemverRange } from "@boilerplate/sdk-core";
import type { MarketplaceModule } from "@boilerplate/platform-api";
import { PlatformApiClient } from "@boilerplate/platform-api/client";
import { checkEntitlement, getEffectiveLicense } from "@boilerplate/license-client";
import {
  runManifestMigrations,
  listTenantContexts,
} from "@boilerplate/module-migration-runner";
import { setOrganizationModules } from "@boilerplate/db/organization";
import { upsertInstalledModule } from "@boilerplate/db/self-hosted";
import { prisma } from "@boilerplate/db";

export type InstallModuleResult =
  | { ok: true; moduleId: string; version: string }
  | { ok: false; code: string; message: string };

export async function installModuleFromMarketplace(opts: {
  moduleId: string;
  organizationId: string;
  centralApiUrl: string;
  installationKey: string;
  platformVersion: string;
  backupConfirmed?: boolean;
}): Promise<InstallModuleResult> {
  const license = await getEffectiveLicense();
  const entitlement = `module:${opts.moduleId}`;
  if (!checkEntitlement(license, entitlement)) {
    return { ok: false, code: "NO_ENTITLEMENT", message: "Módulo não licenciado" };
  }

  const client = new PlatformApiClient({
    baseUrl: opts.centralApiUrl,
    installationKey: opts.installationKey,
  });
  const { modules } = await client.listMarketplaceModules();
  const listing = modules.find((m) => m.id === opts.moduleId);
  if (!listing) {
    return { ok: false, code: "NOT_FOUND", message: "Módulo não encontrado no marketplace" };
  }

  const compat = validateModuleCompatibility(listing, opts.platformVersion);
  if (!compat.ok) return compat;

  const active = await prisma.moduloAtivo.findMany({
    where: { organizationId: opts.organizationId },
    select: { moduloId: true },
  });
  const activeIds = [...new Set([...active.map((a) => a.moduloId), opts.moduleId])];
  await setOrganizationModules(opts.organizationId, activeIds);

  if (listing.migrations.length > 0) {
    const tenants = await listTenantContexts();
    for (const manifest of listing.migrations) {
      await runManifestMigrations({
        manifest,
        schemaNames: tenants.map((t) => t.schemaName),
        organizationIds: tenants.map((t) => t.organizationId),
        activeModuleIds: activeIds,
        backupConfirmed: opts.backupConfirmed,
      });
    }
  }

  await upsertInstalledModule({
    moduleId: opts.moduleId,
    version: listing.currentVersion,
  });

  const { getModule } = await import("@boilerplate/module-registry");
  const mod = getModule(opts.moduleId) as {
    onInstall?: (orgId: string, ctx: { organizationId: string }) => Promise<void>;
  } | undefined;
  if (mod?.onInstall) {
    await mod.onInstall(opts.organizationId, {
      organizationId: opts.organizationId,
    });
  }

  return { ok: true, moduleId: opts.moduleId, version: listing.currentVersion };
}

function validateModuleCompatibility(
  listing: MarketplaceModule,
  platformVersion: string,
): InstallModuleResult {
  if (
    !satisfiesSemverRange(platformVersion, listing.minimumPlatformVersion)
  ) {
    return {
      ok: false,
      code: "INCOMPATIBLE_PLATFORM",
      message: `Requer plataforma >= ${listing.minimumPlatformVersion}`,
    };
  }
  return { ok: true, moduleId: listing.id, version: listing.currentVersion };
}
