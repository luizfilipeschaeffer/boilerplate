"use server";

import {
  assertActiveMembership,
  checkIntegratorHealth,
  clearTenantCredentialOverride,
  getCredentialStatus,
  getIntegratorConfigFields,
  listPlatformIntegratorCatalog,
  upsertTenantCredential,
  type CredentialStatus,
  type IntegratorConfigField,
} from "@boilerplate/db";
import { auth } from "@/auth";
import {
  assertRateLimit,
  credentialRateLimit,
  rateLimitKey,
  validatedAction,
} from "@boilerplate/shared/security";
import { z } from "zod";
import { assertSameOriginAction, getClientIpFromHeaders } from "@/lib/action-security";
import { headers } from "next/headers";

export type TenantIntegratorRow = {
  integratorId: string;
  label: string;
  tipo: string;
  fields: IntegratorConfigField[];
  status: CredentialStatus;
};

function sanitizeStatus(status: CredentialStatus): CredentialStatus {
  return {
    ...status,
    maskedSecrets: status.maskedSecrets ?? {},
  };
}

function splitFormValues(
  fields: IntegratorConfigField[],
  values: Record<string, string>,
): {
  secrets: Record<string, string>;
  configPublic: Record<string, unknown>;
} {
  const secrets: Record<string, string> = {};
  const configPublic: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key]?.trim() ?? "";
    if (!value) continue;
    if (field.type === "secret") {
      secrets[field.key] = value;
    } else {
      configPublic[field.key] = value;
    }
  }
  return { secrets, configPublic };
}

async function requireDonoMembership() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const membership = await assertActiveMembership(userId, { minRole: "dono" });
  return { organizationId: membership.organizationId, userId };
}

const saveCredentialsSchema = z.object({
  integratorId: z.string().min(1).max(120),
  values: z.record(z.string().max(2000)),
});

export async function loadTenantIntegratorsPage(): Promise<{
  integrators: TenantIntegratorRow[];
  canEdit: boolean;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  let organizationId: string | null = null;
  let canEdit = false;

  if (userId) {
    try {
      const membership = await assertActiveMembership(userId);
      organizationId = membership.organizationId;
      canEdit = membership.role === "dono";
    } catch {
      organizationId = null;
      canEdit = false;
    }
  }

  const catalog = await listPlatformIntegratorCatalog();
  const integrators: TenantIntegratorRow[] = [];

  for (const item of catalog) {
    const fields = getIntegratorConfigFields(item.id);
    if (fields.length === 0) continue;
    if (item.implementationStatus === "planned") continue;

    const status = organizationId
      ? sanitizeStatus(await getCredentialStatus(item.id, organizationId))
      : {
          configured: false,
          source: "none" as const,
          maskedSecrets: {},
          configPublic: {},
        };

    integrators.push({
      integratorId: item.id,
      label: item.label,
      tipo: item.tipo,
      fields: fields.map((f) =>
        f.type === "secret" ? { ...f } : f,
      ),
      status,
    });
  }

  return { integrators, canEdit };
}

export async function saveTenantIntegratorCredentialsAction(input: {
  integratorId: string;
  values: Record<string, string>;
}): Promise<CredentialStatus> {
  return validatedAction(saveCredentialsSchema, input, async (data) => {
    await assertSameOriginAction();
    const h = await headers();
    const ip = getClientIpFromHeaders(h);
    const { organizationId, userId } = await requireDonoMembership();
    await assertRateLimit(
      credentialRateLimit,
      rateLimitKey(ip, `cred-save:${userId}`),
    );

    const fields = getIntegratorConfigFields(data.integratorId);
    if (fields.length === 0) {
      throw new Error("Integrador sem schema de credenciais.");
    }

    const { secrets, configPublic } = splitFormValues(fields, data.values);
    const existing = await getCredentialStatus(data.integratorId, organizationId);

    if (!existing.configured && Object.keys(secrets).length === 0) {
      throw new Error("Informe os campos secretos obrigatórios.");
    }

    await upsertTenantCredential({
      organizationId,
      integratorId: data.integratorId,
      secrets,
      configPublic,
    });

    return sanitizeStatus(await getCredentialStatus(data.integratorId, organizationId));
  }) as Promise<CredentialStatus>;
}

export async function restoreTenantIntegratorDefaultAction(
  integratorId: string,
): Promise<CredentialStatus> {
  await assertSameOriginAction();
  const { organizationId } = await requireDonoMembership();
  await clearTenantCredentialOverride(organizationId, integratorId);
  return sanitizeStatus(await getCredentialStatus(integratorId, organizationId));
}

export async function testTenantIntegratorConnectionAction(
  integratorId: string,
): Promise<{ ok: boolean; message: string }> {
  await assertSameOriginAction();
  const { organizationId } = await requireDonoMembership();
  return checkIntegratorHealth(integratorId, organizationId);
}
