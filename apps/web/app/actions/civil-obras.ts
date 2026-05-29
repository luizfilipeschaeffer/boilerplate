"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { emitAndPersist } from "@/lib/events/emit";
import {
  assertCivilObrasPermission,
  canAdminCivilObras,
  canColaboradorCivilObras,
  canViewCivilObras,
  CIVIL_OBRAS_ROUTES,
} from "@/lib/civil-obras-access";
import { buildRelatorioPdfBuffer } from "@/lib/civil-obras-pdf";
import {
  COOKIE_NAME,
  signCivilObrasSession,
  verifyCivilObrasSession,
} from "@/lib/civil-obras-session";
import { requireTenantContext } from "@/lib/tenant-context";
import type {
  CreateEntradaInput,
  CreateObraInput,
  ConviteUsuarioInput,
  ObraStatus,
} from "@boilerplate/civil-obras";
import {
  acceptCivilObraInvite,
  authenticateCivilObraUsuario,
  buscarCivilObras,
  createCivilObra,
  createCivilObraEntrada,
  findCivilObraUsuarioByToken,
  getCivilObra,
  getCivilObraEntrada,
  getRelatorioListagem,
  inviteCivilObraUsuario,
  listCivilObraEntradas,
  listCivilObraEventos,
  listCivilObraUsuarios,
  listCivilObras,
  listObrasForObraUsuario,
  listUsuariosObraForNotificacao,
  revokeCivilObraUsuario,
  saveCivilObraRelatorio,
} from "@boilerplate/db";
import { resolve } from "@boilerplate/db";
import { presignUploadUrl } from "@boilerplate/integrators";
import { randomUUID } from "node:crypto";

const STORAGE_INTEGRATOR = "storage-s3-mock";

async function ctx() {
  return requireTenantContext();
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function listCivilObrasAction(filters?: {
  status?: ObraStatus;
  search?: string;
}) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return listCivilObras(c.schemaName, c.organizationId, filters);
}

export async function getCivilObraAction(obraId: string) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return getCivilObra(c.schemaName, c.organizationId, obraId);
}

export async function createCivilObraAction(input: CreateObraInput) {
  const c = await ctx();
  assertCivilObrasPermission(c.role, "admin");
  const obra = await createCivilObra(
    c.schemaName,
    c.organizationId,
    c.membershipId,
    input,
  );
  revalidatePath(CIVIL_OBRAS_ROUTES.home);
  return obra;
}

export async function listCivilObraEntradasAction(obraId: string) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return listCivilObraEntradas(c.schemaName, c.organizationId, obraId);
}

export async function getCivilObraEntradaAction(entradaId: string) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return getCivilObraEntrada(c.schemaName, c.organizationId, entradaId);
}

export async function createCivilObraEntradaAction(input: CreateEntradaInput) {
  const c = await ctx();
  if (!canColaboradorCivilObras(c.role) && !canAdminCivilObras(c.role)) {
    throw new Error("Sem permissão para publicar entrada");
  }
  const entrada = await createCivilObraEntrada(
    c.schemaName,
    c.organizationId,
    c.membershipId,
    input,
    true,
  );
  const trecho =
    typeof input.corpo === "object" && input.corpo && "text" in input.corpo
      ? String((input.corpo as { text?: string }).text ?? "").slice(0, 200)
      : "";
  const link = `${appBaseUrl()}${CIVIL_OBRAS_ROUTES.diario(input.obraId)}`;
  await emitAndPersist({
    organizationId: c.organizationId,
    schemaName: c.schemaName,
    type: "civil-obras.entrada.publicada",
    payload: {
      entradaId: entrada.id,
      obraId: input.obraId,
      titulo: entrada.titulo,
      trecho,
      link,
      mencaoUsuarioIds: input.mencaoUsuarioIds ?? [],
      schemaName: c.schemaName,
    },
  });
  revalidatePath(CIVIL_OBRAS_ROUTES.diario(input.obraId));
  return entrada;
}

export async function listCivilObraUsuariosAction(obraId: string) {
  const c = await ctx();
  assertCivilObrasPermission(c.role, "admin");
  return listCivilObraUsuarios(c.schemaName, c.organizationId, obraId);
}

export async function inviteCivilObraUsuarioAction(input: ConviteUsuarioInput) {
  const c = await ctx();
  assertCivilObrasPermission(c.role, "admin");
  const { token, usuarioId } = await inviteCivilObraUsuario(
    c.schemaName,
    c.organizationId,
    input,
  );
  const conviteLink = `${appBaseUrl()}/civil-obras/convite/${token}?org=${c.organizationId}`;
  await emitAndPersist({
    organizationId: c.organizationId,
    schemaName: c.schemaName,
    type: "civil-obras.usuario.convidado",
    payload: {
      usuarioId,
      obraId: input.obraId,
      email: input.email,
      nome: input.nome,
      conviteLink,
      schemaName: c.schemaName,
    },
  });
  revalidatePath(CIVIL_OBRAS_ROUTES.usuarios(input.obraId));
  return { conviteLink };
}

export async function revokeCivilObraUsuarioAction(
  obraId: string,
  usuarioId: string,
) {
  const c = await ctx();
  assertCivilObrasPermission(c.role, "admin");
  await revokeCivilObraUsuario(c.schemaName, c.organizationId, usuarioId);
  revalidatePath(CIVIL_OBRAS_ROUTES.usuarios(obraId));
}

export async function acceptCivilObraInviteAction(input: {
  token: string;
  senha: string;
  schemaName: string;
}) {
  const result = await acceptCivilObraInvite(
    input.schemaName,
    input.token,
    input.senha,
  );
  if (!result.ok) return result;
  const sessionToken = await signCivilObrasSession({
    scope: "civil-obras",
    usuarioId: result.usuarioId,
    obraId: result.obraId,
    tenantId: result.tenantId,
    schemaName: input.schemaName,
    perfil: "colaborador",
    sessionVersion: 0,
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/civil-obras",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true as const, obraId: result.obraId };
}

export async function loginCivilObraUsuarioAction(input: {
  schemaName: string;
  email: string;
  senha: string;
}) {
  const user = await authenticateCivilObraUsuario(
    input.schemaName,
    input.email,
    input.senha,
  );
  if (!user) return { ok: false as const, error: "Credenciais inválidas" };
  const token = await signCivilObrasSession({
    scope: "civil-obras",
    usuarioId: user.id,
    obraId: user.obraId,
    tenantId: user.tenantId,
    schemaName: input.schemaName,
    perfil: user.perfil,
    sessionVersion: user.sessionVersion,
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/civil-obras",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true as const, obraId: user.obraId };
}

export async function getCivilObraObraSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyCivilObrasSession(raw);
}

export async function listObrasObraSessionAction() {
  const session = await getCivilObraObraSession();
  if (!session) throw new Error("Sessão de obra inválida");
  return listObrasForObraUsuario(
    session.schemaName,
    session.tenantId,
    session.usuarioId,
  );
}

export async function listCivilObraEventosAction(
  obraId: string,
  range?: { start: string; end: string },
) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return listCivilObraEventos(c.schemaName, c.organizationId, obraId, range);
}

export async function buscarCivilObrasAction(obraId: string, query: string) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return buscarCivilObras(c.schemaName, c.organizationId, obraId, query);
}

export async function getRelatorioListagemAction(
  obraId: string,
  periodoInicio: string,
  periodoFim: string,
  autorId?: string,
) {
  const c = await ctx();
  if (!canViewCivilObras(c.role)) throw new Error("Sem permissão");
  return getRelatorioListagem(
    c.schemaName,
    c.organizationId,
    obraId,
    periodoInicio,
    periodoFim,
    autorId,
  );
}

export async function exportRelatorioPdfAction(
  obraId: string,
  periodoInicio: string,
  periodoFim: string,
) {
  const c = await ctx();
  assertCivilObrasPermission(c.role, "admin");
  const listagem = await getRelatorioListagem(
    c.schemaName,
    c.organizationId,
    obraId,
    periodoInicio,
    periodoFim,
  );
  if (!listagem) throw new Error("Obra não encontrada");
  const pdfBuffer = buildRelatorioPdfBuffer(
    listagem.obra,
    listagem.entradas,
    periodoInicio,
    periodoFim,
  );
  const creds = await resolve(STORAGE_INTEGRATOR, c.organizationId);
  const key = `relatorios/${obraId}/${randomUUID()}.pdf`;
  const { publicUrl } = presignUploadUrl(creds, key, 86400);
  const relatorio = await saveCivilObraRelatorio(c.schemaName, c.organizationId, {
    obraId,
    periodoInicio,
    periodoFim,
    pdfUrl: publicUrl,
    geradoPor: c.membershipId,
  });
  void pdfBuffer;
  await emitAndPersist({
    organizationId: c.organizationId,
    schemaName: c.schemaName,
    type: "civil-obras.relatorio.gerado",
    payload: {
      relatorioId: relatorio.id,
      obraId,
      pdfUrl: publicUrl,
      schemaName: c.schemaName,
    },
  });
  return relatorio;
}

export async function getPresignedUploadUrlAction(input: {
  obraId: string;
  fileName: string;
  contentType: string;
}) {
  const c = await ctx();
  if (!canColaboradorCivilObras(c.role) && !canAdminCivilObras(c.role)) {
    throw new Error("Sem permissão para upload");
  }
  const obra = await getCivilObra(c.schemaName, c.organizationId, input.obraId);
  if (!obra) throw new Error("Obra não encontrada");
  const creds = await resolve(STORAGE_INTEGRATOR, c.organizationId);
  const key = `obras/${input.obraId}/${randomUUID()}-${input.fileName}`;
  return presignUploadUrl(creds, key);
}

export async function resolveInviteTokenAction(
  schemaName: string,
  token: string,
) {
  const row = await findCivilObraUsuarioByToken(schemaName, token);
  if (!row) return null;
  return {
    nome: row.nome,
    email: row.email,
    obraId: row.obra_id,
    expired: row.token_expires_at ? row.token_expires_at < new Date() : false,
    revoked: !!row.revoked_at,
  };
}
