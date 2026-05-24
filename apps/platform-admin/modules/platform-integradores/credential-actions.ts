"use server";

import {
  checkIntegratorHealth,
  getCredentialStatus,
  getIntegratorConfigFields,
  listPlatformIntegratorCatalog,
  upsertPlatformCredential,
  type CredentialStatus,
  type IntegratorConfigField,
} from "@boilerplate/db";
import { canEditGateways } from "../platform-segmentos/can-edit-segments";
import { requirePlatformModule } from "@/lib/platform-access";
import {
  assertRateLimit,
  credentialRateLimit,
  rateLimitKey,
  validatedAction,
} from "@boilerplate/shared/security";
import { z } from "zod";
import { headers } from "next/headers";

export type IntegratorCredentialPageData = {
  integratorId: string;
  label: string;
  fields: IntegratorConfigField[];
  status: CredentialStatus;
  canEdit: boolean;
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

function getClientIp(h: Headers): string | null {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

export async function loadIntegratorCredentialPage(
  integratorId: string,
): Promise<IntegratorCredentialPageData | null> {
  const ctx = await requirePlatformModule("platform-integradores");
  const catalog = await listPlatformIntegratorCatalog();
  const integrator = catalog.find((i) => i.id === integratorId);
  if (!integrator) return null;

  const fields = getIntegratorConfigFields(integratorId);
  const status = sanitizeStatus(await getCredentialStatus(integratorId));

  return {
    integratorId,
    label: integrator.label,
    fields: fields.map((f) =>
      f.type === "secret" ? { ...f } : f,
    ),
    status,
    canEdit: canEditGateways(ctx.platformRole),
  };
}

const saveSchema = z.object({
  integratorId: z.string().min(1).max(120),
  values: z.record(z.string().max(2000)),
});

export async function savePlatformIntegratorCredentialsAction(input: {
  integratorId: string;
  values: Record<string, string>;
}): Promise<CredentialStatus> {
  return validatedAction(saveSchema, input, async (data) => {
    const ctx = await requirePlatformModule("platform-integradores");
    if (!canEditGateways(ctx.platformRole)) {
      throw new Error("Somente administradores podem alterar credenciais.");
    }

    const h = await headers();
    await assertRateLimit(
      credentialRateLimit,
      rateLimitKey(getClientIp(h), `platform-cred:${ctx.userId}`),
    );

    const fields = getIntegratorConfigFields(data.integratorId);
    if (fields.length === 0) {
      throw new Error("Este integrador não possui schema de credenciais.");
    }

    const { secrets, configPublic } = splitFormValues(fields, data.values);
    const existing = await getCredentialStatus(data.integratorId);

    if (!existing.configured && Object.keys(secrets).length === 0) {
      const required = fields.filter((f) => f.required && f.type === "secret");
      if (required.length > 0) {
        throw new Error("Informe os campos obrigatórios.");
      }
    }

    await upsertPlatformCredential({
      integratorId: data.integratorId,
      secrets,
      configPublic,
      actorPlatformUserId: ctx.userId,
    });

    return sanitizeStatus(await getCredentialStatus(data.integratorId));
  }) as Promise<CredentialStatus>;
}

export async function testPlatformIntegratorConnectionAction(
  integratorId: string,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await requirePlatformModule("platform-integradores");
  if (!canEditGateways(ctx.platformRole)) {
    throw new Error("Somente administradores podem testar credenciais.");
  }
  return checkIntegratorHealth(integratorId);
}
