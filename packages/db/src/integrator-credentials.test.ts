import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { randomBytes } from "node:crypto";
import { prisma } from "./client";
import {
  clearIntegratorCredentialCache,
  clearTenantCredentialOverride,
  getCredentialStatus,
  IntegratorCredentialNotConfiguredError,
  resolve,
  upsertPlatformCredential,
  upsertTenantCredential,
} from "./integrator-credentials";

const TEST_INTEGRATOR = "test-integrator-credentials";
const TEST_ORG_SLUG = "test-integrator-creds-org";
const SECRET_VALUE = "super_secret_test_api_key_xyz";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
const describeDb = hasDatabase ? describe : describe.skip;

describeDb("integrator-credentials (DB)", () => {
  let organizationId: string;
  const kek = randomBytes(32).toString("base64");

  beforeAll(async () => {
    process.env.INTEGRATOR_ENCRYPTION_KEY = kek;
    clearIntegratorCredentialCache();

    await prisma.platformIntegratorCredential.deleteMany({
      where: { integratorId: TEST_INTEGRATOR },
    });
    await prisma.tenantIntegrator.deleteMany({
      where: { integratorId: TEST_INTEGRATOR },
    });
    await prisma.organization.deleteMany({
      where: { slug: TEST_ORG_SLUG },
    });

    const org = await prisma.organization.create({
      data: {
        name: "Test Integrator Org",
        slug: TEST_ORG_SLUG,
        schemaName: "tenant_test_integrator_creds",
        tipoNegocio: "varejo",
      },
    });
    organizationId = org.id;
  });

  afterAll(async () => {
    clearIntegratorCredentialCache();
    await prisma.platformIntegratorCredential.deleteMany({
      where: { integratorId: TEST_INTEGRATOR },
    });
    await prisma.tenantIntegrator.deleteMany({
      where: { integratorId: TEST_INTEGRATOR },
    });
    await prisma.organization.deleteMany({
      where: { slug: TEST_ORG_SLUG },
    });
    await prisma.platformConfigAuditLog.deleteMany({
      where: { entityId: { contains: TEST_INTEGRATOR } },
    });
  });

  test("upsertPlatform + resolve retorna secrets corretos", async () => {
    await upsertPlatformCredential({
      integratorId: TEST_INTEGRATOR,
      secrets: { apiKey: SECRET_VALUE },
      configPublic: { fromEmail: "dev@test.local" },
    });

    const row = await prisma.platformIntegratorCredential.findUnique({
      where: { integratorId: TEST_INTEGRATOR },
    });
    expect(row?.credentialsEncrypted).toBeTruthy();
    expect(row?.credentialsEncrypted).not.toContain(SECRET_VALUE);
    expect(row?.credentialsEncrypted).not.toContain("apiKey");

    const resolved = await resolve(TEST_INTEGRATOR);
    expect(resolved.source).toBe("platform");
    expect(resolved.secrets.apiKey).toBe(SECRET_VALUE);
  });

  test("tenant override tem prioridade sobre plataforma", async () => {
    const tenantSecret = "tenant_override_secret_key_abc";
    await upsertTenantCredential({
      organizationId,
      integratorId: TEST_INTEGRATOR,
      secrets: { apiKey: tenantSecret },
    });

    const resolved = await resolve(TEST_INTEGRATOR, organizationId);
    expect(resolved.source).toBe("tenant");
    expect(resolved.secrets.apiKey).toBe(tenantSecret);
  });

  test("sem override tenant usa plataforma", async () => {
    await clearTenantCredentialOverride(organizationId, TEST_INTEGRATOR);
    const resolved = await resolve(TEST_INTEGRATOR, organizationId);
    expect(resolved.source).toBe("platform");
    expect(resolved.secrets.apiKey).toBe(SECRET_VALUE);
  });

  test("getCredentialStatus não expõe plaintext", async () => {
    const status = await getCredentialStatus(TEST_INTEGRATOR, organizationId);
    const json = JSON.stringify(status);
    expect(json).not.toContain(SECRET_VALUE);
    expect(status.configured).toBe(true);
    expect(status.maskedSecrets.apiKey).toMatch(/xyz$/);
  });

  test("audit log sem valores de secret", async () => {
    await upsertPlatformCredential({
      integratorId: TEST_INTEGRATOR,
      secrets: { apiKey: "rotated_secret_value_9999" },
    });

    const logs = await prisma.platformConfigAuditLog.findMany({
      where: {
        entityType: "integrator_credential",
        entityId: `platform:${TEST_INTEGRATOR}`,
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    expect(logs.length).toBeGreaterThan(0);
    const diff = JSON.stringify(logs[0]?.diff ?? {});
    expect(diff).toContain("fieldsUpdated");
    expect(diff).not.toContain("rotated_secret_value_9999");
  });

  test("integrador ausente lança erro explícito", async () => {
    await expect(resolve("integrador-inexistente-xyz")).rejects.toBeInstanceOf(
      IntegratorCredentialNotConfiguredError,
    );
  });
});
