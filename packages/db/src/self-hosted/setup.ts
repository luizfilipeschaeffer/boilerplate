import type { LicensePayload } from "@boilerplate/platform-api";
import { prisma } from "../client";
import { setOrganizationModules } from "../organization";
import { provisionTenantSchema } from "../tenant/provision";
import {
  ensureLocalInstallTables,
  loadInstallationConfigRow,
  saveInstallationConfig,
} from "./local-install-state";
import { saveLocalAllowedOrigins, normalizeHost } from "./origin-control";
import { encryptInstallationSecrets } from "./crypto";

export type DatabaseHealth = {
  ok: boolean;
  version?: string;
  schemaReady: boolean;
  tenantSchemaCount: number;
  error?: string;
};

export type SetupStatus = {
  complete: boolean;
  step: "database" | "platform" | "account" | "license" | "done";
  database: DatabaseHealth | null;
  hasInstallation: boolean;
  hasLicense: boolean;
  publicUrl?: string;
};

export async function detectDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const versionRows = await prisma.$queryRaw<{ version: string }[]>`
      SELECT version() as version
    `;
    await ensureLocalInstallTables();
    const schemaRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `;
    const tenantSchemaCount = Number(schemaRows[0]?.count ?? 0);
    return {
      ok: true,
      version: versionRows[0]?.version,
      schemaReady: true,
      tenantSchemaCount,
    };
  } catch (err) {
    return {
      ok: false,
      schemaReady: false,
      tenantSchemaCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getSetupStatus(): Promise<SetupStatus> {
  await ensureLocalInstallTables();
  const row = await loadInstallationConfigRow();
  const envComplete = process.env.SETUP_COMPLETE === "true";
  const dbComplete = row?.setup_completed_at != null || envComplete;
  const hasInstallation = Boolean(
    row?.installation_id || process.env.INSTALLATION_ID,
  );

  let step: SetupStatus["step"] = "database";
  if (dbComplete) step = "done";
  else if (hasInstallation && row?.setup_step === "license") step = "license";
  else if (hasInstallation && row?.setup_step === "account") step = "account";
  else if (hasInstallation || row?.setup_step === "platform") step = "platform";
  else if (row?.setup_step === "database") step = "database";

  const database = await detectDatabaseHealth();

  return {
    complete: dbComplete && hasInstallation,
    step: dbComplete ? "done" : step,
    database,
    hasInstallation,
    hasLicense: Boolean(row?.last_sync_at),
    publicUrl: row?.public_url ?? undefined,
  };
}

export async function saveSetupStep(
  step: SetupStatus["step"],
): Promise<void> {
  await ensureLocalInstallTables();
  await prisma.$executeRaw`
    INSERT INTO boilerplate.installation_config (id, central_api_url, setup_step)
    VALUES ('default', ${process.env.CENTRAL_API_URL ?? "http://localhost:3002"}, ${step})
    ON CONFLICT (id) DO UPDATE SET setup_step = EXCLUDED.setup_step
  `;
}

export async function registerInstallationInSetup(opts: {
  centralApiUrl: string;
  installationToken: string;
  publicUrl?: string;
}): Promise<{
  installationId: string;
  installationKey: string;
  organizationId: string;
}> {
  const res = await fetch(
    `${opts.centralApiUrl.replace(/\/$/, "")}/api/v1/installations/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
      body: JSON.stringify({
        installationToken: opts.installationToken,
        publicUrl: opts.publicUrl,
        platformVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
      }),
    },
  );
  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      "A plataforma central redirecionou a requisição (provavelmente exige login). Verifique a URL e se a API /api/v1 está acessível.",
    );
  }
  const raw = await res.text();
  if (!res.ok) {
    let message = raw.slice(0, 300) || "REGISTER_FAILED";
    try {
      const errBody = JSON.parse(raw) as { error?: string; message?: string };
      message = errBody.error ?? errBody.message ?? message;
    } catch {
      /* resposta não-JSON */
    }
    throw new Error(message);
  }
  let body: {
    installationId: string;
    installationKey: string;
    organizationId: string;
    oauthClientId: string;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    throw new Error(
      "Resposta inválida da plataforma central (esperado JSON). Confira CENTRAL_API_URL e se o platform-admin está rodando.",
    );
  }

  await saveInstallationConfig({
    centralApiUrl: opts.centralApiUrl,
    installationId: body.installationId,
    installationKeyEnc: encryptInstallationSecrets({
      installationKey: body.installationKey,
    }),
    oauthClientId: body.oauthClientId,
    publicUrl: opts.publicUrl,
  });

  if (opts.publicUrl) {
    const host = normalizeHost(opts.publicUrl);
    await saveLocalAllowedOrigins([host]);
  }

  await saveSetupStep("account");
  return body;
}

export function moduleIdsFromEntitlements(entitlements: string[]): string[] {
  return entitlements
    .filter((e) => e.startsWith("module:"))
    .map((e) => e.slice("module:".length));
}

export async function provisionModulesFromLicense(
  license: LicensePayload,
): Promise<{ installed: string[]; skipped: string[] }> {
  const moduleIds = moduleIdsFromEntitlements(license.entitlements);
  const installed: string[] = [];
  const skipped: string[] = [];

  const org = await prisma.organization.findUnique({
    where: { id: license.organizationId },
    select: { id: true, schemaName: true },
  });

  if (!org) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  await setOrganizationModules(license.organizationId, moduleIds);

  for (const moduleId of moduleIds) {
    try {
      await provisionTenantSchema(org.schemaName);
      installed.push(moduleId);
    } catch {
      skipped.push(moduleId);
    }
  }

  return { installed, skipped };
}

export async function completeSetupWizard(opts: {
  license: LicensePayload;
  publicUrl?: string;
  allowedOrigins?: string[];
}): Promise<{ installedModules: string[] }> {
  const { getLocalAllowedOrigins, saveLocalAllowedOrigins: saveOrigins } =
    await import("./origin-control");

  const mergedOrigins = new Set<string>();
  if (opts.publicUrl) mergedOrigins.add(normalizeHost(opts.publicUrl));
  for (const o of opts.allowedOrigins ?? []) mergedOrigins.add(normalizeHost(o));
  for (const o of opts.license.allowedOrigins ?? []) mergedOrigins.add(normalizeHost(o));
  for (const o of await getLocalAllowedOrigins()) mergedOrigins.add(o);

  if (mergedOrigins.size > 0) {
    await saveOrigins([...mergedOrigins]);
  }

  const { installed } = await provisionModulesFromLicense(opts.license);

  await prisma.$executeRaw`
    UPDATE boilerplate.installation_config
    SET setup_completed_at = NOW(), setup_step = 'done'
    WHERE id = 'default'
  `;

  return { installedModules: installed };
}
