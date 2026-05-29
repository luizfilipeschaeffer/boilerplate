import { prisma } from "../client";

/** Estado local de instalação (self-hosted) — tabelas via SQL raw */
export async function ensureLocalInstallTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS boilerplate.installation_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      central_api_url TEXT NOT NULL DEFAULT '',
      installation_id TEXT,
      installation_key_enc TEXT,
      oauth_client_id TEXT,
      public_url TEXT,
      allowed_origins JSONB NOT NULL DEFAULT '[]',
      setup_step TEXT NOT NULL DEFAULT 'database',
      setup_completed_at TIMESTAMPTZ,
      last_sync_at TIMESTAMPTZ
    );
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE boilerplate.installation_config
      ADD COLUMN IF NOT EXISTS public_url TEXT,
      ADD COLUMN IF NOT EXISTS allowed_origins JSONB NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS setup_step TEXT NOT NULL DEFAULT 'database',
      ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS boilerplate.license_cache (
      id TEXT PRIMARY KEY DEFAULT 'default',
      payload_json JSONB NOT NULL DEFAULT '{}',
      signature TEXT NOT NULL DEFAULT '',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      valid_until TIMESTAMPTZ
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS boilerplate.module_migrations_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id TEXT NOT NULL,
      migration_id TEXT NOT NULL,
      version TEXT NOT NULL,
      checksum TEXT NOT NULL,
      status TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      error_message TEXT,
      UNIQUE(module_id, migration_id)
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS boilerplate.installed_modules (
      module_id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'marketplace',
      manifest_checksum TEXT
    );
  `);
}

export async function saveLicenseCache(opts: {
  payloadJson: string;
  signature: string;
  expiresAt: Date;
  validUntil: Date;
}): Promise<void> {
  await ensureLocalInstallTables();
  await prisma.$executeRaw`
    INSERT INTO boilerplate.license_cache (id, payload_json, signature, fetched_at, expires_at, valid_until)
    VALUES ('default', ${opts.payloadJson}::jsonb, ${opts.signature}, NOW(), ${opts.expiresAt}, ${opts.validUntil})
    ON CONFLICT (id) DO UPDATE SET
      payload_json = EXCLUDED.payload_json,
      signature = EXCLUDED.signature,
      fetched_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      valid_until = EXCLUDED.valid_until
  `;
}

export async function loadLicenseCache(): Promise<{
  payloadJson: string;
  signature: string;
  validUntil: Date;
} | null> {
  await ensureLocalInstallTables();
  const rows = await prisma.$queryRaw<
    { payload_json: unknown; signature: string; valid_until: Date }[]
  >`SELECT payload_json, signature, valid_until FROM boilerplate.license_cache WHERE id = 'default'`;
  const row = rows[0];
  if (!row) return null;
  return {
    payloadJson: JSON.stringify(row.payload_json),
    signature: row.signature,
    validUntil: row.valid_until,
  };
}

export type InstallationConfigRow = {
  central_api_url: string;
  installation_id: string | null;
  installation_key_enc: string | null;
  oauth_client_id: string | null;
  public_url: string | null;
  allowed_origins: unknown;
  setup_step: string | null;
  setup_completed_at: Date | null;
  last_sync_at: Date | null;
};

export async function loadInstallationConfigRow(): Promise<InstallationConfigRow | null> {
  await ensureLocalInstallTables();
  const rows = await prisma.$queryRaw<InstallationConfigRow[]>`
    SELECT central_api_url, installation_id, installation_key_enc, oauth_client_id,
           public_url, allowed_origins, setup_step, setup_completed_at, last_sync_at
    FROM boilerplate.installation_config WHERE id = 'default'
  `;
  return rows[0] ?? null;
}

export async function getInstallationCredentialsFromConfig(): Promise<{
  installationId: string;
  installationKey: string;
  centralApiUrl: string;
} | null> {
  const row = await loadInstallationConfigRow();
  if (!row?.installation_id || !row.installation_key_enc) return null;
  const { decryptInstallationSecrets } = await import("./crypto");
  const secrets = decryptInstallationSecrets(row.installation_key_enc);
  const key = secrets.installationKey;
  if (!key) return null;
  return {
    installationId: row.installation_id,
    installationKey: key,
    centralApiUrl: row.central_api_url,
  };
}

export async function saveInstallationConfig(opts: {
  centralApiUrl: string;
  installationId: string;
  installationKeyEnc: string;
  oauthClientId: string;
  publicUrl?: string;
}): Promise<void> {
  await ensureLocalInstallTables();
  await prisma.$executeRaw`
    INSERT INTO boilerplate.installation_config (
      id, central_api_url, installation_id, installation_key_enc, oauth_client_id, public_url, last_sync_at
    )
    VALUES (
      'default', ${opts.centralApiUrl}, ${opts.installationId}, ${opts.installationKeyEnc},
      ${opts.oauthClientId}, ${opts.publicUrl ?? null}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      central_api_url = EXCLUDED.central_api_url,
      installation_id = EXCLUDED.installation_id,
      installation_key_enc = EXCLUDED.installation_key_enc,
      oauth_client_id = EXCLUDED.oauth_client_id,
      public_url = COALESCE(EXCLUDED.public_url, boilerplate.installation_config.public_url),
      last_sync_at = NOW()
  `;
}

export async function isSetupComplete(): Promise<boolean> {
  if (process.env.SETUP_COMPLETE === "true") return true;
  const row = await loadInstallationConfigRow();
  return row?.setup_completed_at != null;
}

export async function recordModuleMigrationHistory(opts: {
  moduleId: string;
  migrationId: string;
  version: string;
  checksum: string;
  status: string;
  errorMessage?: string;
}): Promise<void> {
  await ensureLocalInstallTables();
  await prisma.$executeRaw`
    INSERT INTO boilerplate.module_migrations_history (module_id, migration_id, version, checksum, status, error_message)
    VALUES (${opts.moduleId}, ${opts.migrationId}, ${opts.version}, ${opts.checksum}, ${opts.status}, ${opts.errorMessage ?? null})
    ON CONFLICT (module_id, migration_id) DO UPDATE SET
      status = EXCLUDED.status,
      executed_at = NOW(),
      error_message = EXCLUDED.error_message
  `;
}

export async function isMigrationAlreadyApplied(
  moduleId: string,
  migrationId: string,
): Promise<boolean> {
  await ensureLocalInstallTables();
  const rows = await prisma.$queryRaw<{ status: string }[]>`
    SELECT status FROM boilerplate.module_migrations_history
    WHERE module_id = ${moduleId} AND migration_id = ${migrationId} AND status = 'success'
  `;
  return rows.length > 0;
}

export async function upsertInstalledModule(opts: {
  moduleId: string;
  version: string;
  manifestChecksum?: string;
}): Promise<void> {
  await ensureLocalInstallTables();
  await prisma.$executeRaw`
    INSERT INTO boilerplate.installed_modules (module_id, version, manifest_checksum)
    VALUES (${opts.moduleId}, ${opts.version}, ${opts.manifestChecksum ?? null})
    ON CONFLICT (module_id) DO UPDATE SET version = EXCLUDED.version, installed_at = NOW()
  `;
}

export async function listInstalledModulesLocal(): Promise<
  { moduleId: string; version: string }[]
> {
  await ensureLocalInstallTables();
  const rows = await prisma.$queryRaw<{ module_id: string; version: string }[]>`
    SELECT module_id, version FROM boilerplate.installed_modules ORDER BY installed_at
  `;
  return rows.map((r) => ({ moduleId: r.module_id, version: r.version }));
}
