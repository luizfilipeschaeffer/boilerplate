"use server";

import { buildAprendizChatBootstrap } from "@/lib/aprendiz-chat/bootstrap";
import type { AprendizChatMessageDto } from "@/lib/aprendiz-chat/types";
import { requireTenantContext } from "@/lib/tenant-context";
import {
  appendAprendizMessage,
  appendAprendizMessages,
  countAprendizMessages,
  getAprendizPerfil,
  listAprendizAutomacoes,
  listAprendizMessages,
  setAprendizAutomation,
} from "@boilerplate/db";
import {
  resumirAprendizado,
  responderMensagemAprendiz,
  TEMPLATES_FASE_1,
  type AprendizPerfilCadastro,
} from "@boilerplate/aprendiz-engine";
import { revalidatePath } from "next/cache";

function mapMessageRow(row: {
  id: string;
  role: string;
  content: string;
  meta: unknown;
  created_at: Date;
}): AprendizChatMessageDto {
  const meta =
    row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
      ? (row.meta as Record<string, unknown>)
      : null;
  return {
    id: row.id,
    role: row.role as "aprendiz" | "user",
    content: row.content,
    meta,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listAprendizAction() {
  const { schemaName } = await requireTenantContext();
  const enabled = await listAprendizAutomacoes(schemaName);
  const map = new Map(enabled.map((e) => [e.template_id, e.enabled]));
  return TEMPLATES_FASE_1.map((t) => ({
    ...t,
    enabled: map.get(t.id) ?? false,
  }));
}

export async function getAprendizAprendizadoAction(): Promise<{
  ownerName: string;
  negocioNome: string;
  insights: string[];
  primeiroContatoAt: string;
} | null> {
  const { schemaName } = await requireTenantContext();
  const row = await getAprendizPerfil(schemaName);
  if (!row) return null;

  const payload = row.payload as unknown as AprendizPerfilCadastro;
  return {
    ownerName: row.owner_name,
    negocioNome: row.negocio_nome,
    insights: resumirAprendizado(payload),
    primeiroContatoAt: row.primeiro_contato_at.toISOString(),
  };
}

export async function toggleAprendizAction(templateId: string, enabled: boolean) {
  const { schemaName } = await requireTenantContext();
  await setAprendizAutomation(schemaName, templateId, enabled);
  revalidatePath("/aprendiz");
}

export async function loadAprendizChatAction(input: {
  primeiroContato: boolean;
}): Promise<{
  messages: AprendizChatMessageDto[];
  templates: Awaited<ReturnType<typeof listAprendizAction>>;
  aprendizado: Awaited<ReturnType<typeof getAprendizAprendizadoAction>>;
}> {
  const { schemaName } = await requireTenantContext();
  const [templates, aprendizado] = await Promise.all([
    listAprendizAction(),
    getAprendizAprendizadoAction(),
  ]);

  if ((await countAprendizMessages(schemaName)) === 0) {
    const ownerName = aprendizado?.ownerName ?? "você";
    const negocioNome = aprendizado?.negocioNome ?? "seu negócio";
    const bootstrap = buildAprendizChatBootstrap({
      primeiroContato: input.primeiroContato,
      ownerName,
      negocioNome,
      insights: aprendizado?.insights ?? [],
    });
    await appendAprendizMessages(schemaName, bootstrap);
  }

  const rows = await listAprendizMessages(schemaName);
  return {
    messages: rows.map(mapMessageRow),
    templates,
    aprendizado,
  };
}

export async function sendAprendizChatMessageAction(
  content: string,
): Promise<AprendizChatMessageDto[]> {
  const ctx = await requireTenantContext();
  const trimmed = content.trim();
  if (!trimmed) return [];

  await appendAprendizMessage(ctx.schemaName, {
    role: "user",
    content: trimmed,
  });

  const perfil = await getAprendizPerfil(ctx.schemaName);
  const firstName =
    perfil?.owner_name.trim().split(/\s+/)[0] ??
    perfil?.owner_name ??
    "você";

  const reply = responderMensagemAprendiz(trimmed, {
    ownerFirstName: firstName,
    negocioNome: perfil?.negocio_nome,
  });

  await appendAprendizMessage(ctx.schemaName, {
    role: "aprendiz",
    content: reply,
  });

  const rows = await listAprendizMessages(ctx.schemaName);
  return rows.map(mapMessageRow);
}

export async function toggleAprendizChatAutomationAction(
  templateId: string,
  enabled: boolean,
): Promise<{
  messages: AprendizChatMessageDto[];
  templates: Awaited<ReturnType<typeof listAprendizAction>>;
}> {
  const ctx = await requireTenantContext();
  await setAprendizAutomation(ctx.schemaName, templateId, enabled);

  const template = TEMPLATES_FASE_1.find((t) => t.id === templateId);
  const label = template?.nome ?? templateId;

  await appendAprendizMessage(ctx.schemaName, {
    role: "user",
    content: enabled ? `Ativar: ${label}` : `Desativar: ${label}`,
    meta: { kind: "automation_toggle", templateId, enabled },
  });

  await appendAprendizMessage(ctx.schemaName, {
    role: "aprendiz",
    content: enabled
      ? `Pronto — “${label}” está ativa. Executo automaticamente quando as condições forem atendidas.`
      : `Ok — “${label}” ficou inativa. Você pode ligar de novo quando quiser.`,
  });

  revalidatePath("/aprendiz");
  const [rows, templates] = await Promise.all([
    listAprendizMessages(ctx.schemaName),
    listAprendizAction(),
  ]);
  return {
    messages: rows.map(mapMessageRow),
    templates,
  };
}
