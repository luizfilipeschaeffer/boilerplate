import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type {
  BuscaResultado,
  ConviteUsuarioInput,
  CreateEntradaInput,
  CreateObraInput,
  EntradaDetail,
  EntradaSummary,
  EventoCalendario,
  ObraDetail,
  ObraStatus,
  ObraSummary,
  RelatorioGerado,
  RelatorioListagem,
  UsuarioObraPerfil,
  UsuarioObraSummary,
} from "@boilerplate/civil-obras";
import { prisma } from "../client";
import { assertSafeSchemaName } from "../tenant/schema";
import { ensureTenantCivilObrasTables } from "./ensure-tables";

export { ensureTenantCivilObrasTables };

function tObras(schema: string) {
  return `"${schema}"."civil_obras_obras"`;
}
function tUsuarios(schema: string) {
  return `"${schema}"."civil_obras_usuarios"`;
}
function tEntradas(schema: string) {
  return `"${schema}"."civil_obras_entradas"`;
}
function tMidias(schema: string) {
  return `"${schema}"."civil_obras_midias"`;
}
function tMencoes(schema: string) {
  return `"${schema}"."civil_obras_mencoes"`;
}
function tEventos(schema: string) {
  return `"${schema}"."civil_obras_eventos"`;
}
function tRelatorios(schema: string) {
  return `"${schema}"."civil_obras_relatorios"`;
}

type ObraRow = {
  id: string;
  tenant_id: string;
  nome: string;
  endereco: string;
  data_inicio: Date;
  data_prevista_conclusao: Date | null;
  status: string;
  fiscal_membership_id: string | null;
  max_upload_image_mb: number;
  max_upload_video_mb: number;
  soft_deleted_at: Date | null;
  created_at: Date;
};

function mapObra(row: ObraRow): ObraSummary {
  return {
    id: row.id,
    nome: row.nome,
    endereco: row.endereco,
    dataInicio: row.data_inicio.toISOString().slice(0, 10),
    dataPrevistaConclusao: row.data_prevista_conclusao
      ? row.data_prevista_conclusao.toISOString().slice(0, 10)
      : null,
    status: row.status as ObraStatus,
    fiscalMembershipId: row.fiscal_membership_id,
    maxUploadImageMb: row.max_upload_image_mb,
    maxUploadVideoMb: row.max_upload_video_mb,
    createdAt: row.created_at.toISOString(),
  };
}

async function ensureTables(schemaName: string) {
  assertSafeSchemaName(schemaName);
  await ensureTenantCivilObrasTables(schemaName);
}

export async function listCivilObras(
  schemaName: string,
  tenantId: string,
  filters?: { status?: ObraStatus; search?: string },
): Promise<ObraSummary[]> {
  await ensureTables(schemaName);
  const table = tObras(schemaName);
  const clauses = ["tenant_id = $1", "soft_deleted_at IS NULL"];
  const params: unknown[] = [tenantId];
  let idx = 2;
  if (filters?.status) {
    clauses.push(`status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters?.search?.trim()) {
    clauses.push(`nome ILIKE $${idx++}`);
    params.push(`%${filters.search.trim()}%`);
  }
  const rows = await prisma.$queryRawUnsafe<ObraRow[]>(
    `SELECT * FROM ${table} WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,
    ...params,
  );
  return rows.map(mapObra);
}

export async function getCivilObra(
  schemaName: string,
  tenantId: string,
  obraId: string,
): Promise<ObraDetail | null> {
  await ensureTables(schemaName);
  const table = tObras(schemaName);
  const rows = await prisma.$queryRawUnsafe<ObraRow[]>(
    `SELECT * FROM ${table} WHERE id = $1 AND tenant_id = $2 AND soft_deleted_at IS NULL`,
    obraId,
    tenantId,
  );
  const row = rows[0];
  if (!row) return null;
  return { ...mapObra(row), softDeletedAt: row.soft_deleted_at?.toISOString() ?? null };
}

export async function createCivilObra(
  schemaName: string,
  tenantId: string,
  fiscalMembershipId: string | null,
  input: CreateObraInput,
): Promise<ObraSummary> {
  await ensureTables(schemaName);
  const id = randomUUID();
  const table = tObras(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${table} (
      id, tenant_id, nome, endereco, data_inicio, data_prevista_conclusao,
      status, fiscal_membership_id, max_upload_image_mb, max_upload_video_mb
    ) VALUES ($1,$2,$3,$4,$5::date,$6::date,$7,$8,$9,$10)`,
    id,
    tenantId,
    input.nome.trim(),
    input.endereco.trim(),
    input.dataInicio,
    input.dataPrevistaConclusao ?? null,
    input.status ?? "planejada",
    fiscalMembershipId,
    input.maxUploadImageMb ?? 50,
    input.maxUploadVideoMb ?? 500,
  );
  const created = await getCivilObra(schemaName, tenantId, id);
  if (!created) throw new Error("Falha ao criar obra");
  return created;
}

export async function listCivilObraEntradas(
  schemaName: string,
  tenantId: string,
  obraId: string,
): Promise<EntradaSummary[]> {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      autor_id: string;
      titulo: string;
      data_registro: Date;
      publicada: boolean;
      created_at: Date;
      midia_count: bigint;
      autor_nome: string | null;
    }[]
  >(
    `SELECT e.*, COUNT(m.id)::bigint AS midia_count, u.nome AS autor_nome
     FROM ${tEntradas(schemaName)} e
     LEFT JOIN ${tMidias(schemaName)} m ON m.entrada_id = e.id
     LEFT JOIN ${tUsuarios(schemaName)} u ON u.id = e.autor_id
     WHERE e.obra_id = $1 AND e.tenant_id = $2
     GROUP BY e.id, u.nome
     ORDER BY e.data_registro DESC`,
    obraId,
    tenantId,
  );
  return rows.map((r) => ({
    id: r.id,
    obraId: r.obra_id,
    autorId: r.autor_id,
    autorNome: r.autor_nome ?? "Fiscal",
    titulo: r.titulo,
    dataRegistro: r.data_registro.toISOString(),
    publicada: r.publicada,
    createdAt: r.created_at.toISOString(),
    midiaCount: Number(r.midia_count),
  }));
}

export async function getCivilObraEntrada(
  schemaName: string,
  tenantId: string,
  entradaId: string,
): Promise<EntradaDetail | null> {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      autor_id: string;
      titulo: string;
      corpo: Record<string, unknown>;
      data_registro: Date;
      publicada: boolean;
      created_at: Date;
      autor_nome: string | null;
    }[]
  >(
    `SELECT e.*, u.nome AS autor_nome
     FROM ${tEntradas(schemaName)} e
     LEFT JOIN ${tUsuarios(schemaName)} u ON u.id = e.autor_id
     WHERE e.id = $1 AND e.tenant_id = $2`,
    entradaId,
    tenantId,
  );
  const row = rows[0];
  if (!row) return null;

  const midias = await prisma.$queryRawUnsafe<
    {
      id: string;
      tipo: string;
      url_storage: string;
      thumbnail_url: string | null;
      tamanho_bytes: bigint;
      nome_original: string;
    }[]
  >(
    `SELECT * FROM ${tMidias(schemaName)} WHERE entrada_id = $1 AND tenant_id = $2`,
    entradaId,
    tenantId,
  );

  const mencoes = await prisma.$queryRawUnsafe<
    { usuario_id: string; nome: string }[]
  >(
    `SELECT m.usuario_id, u.nome
     FROM ${tMencoes(schemaName)} m
     JOIN ${tUsuarios(schemaName)} u ON u.id = m.usuario_id
     WHERE m.entrada_id = $1 AND m.tenant_id = $2`,
    entradaId,
    tenantId,
  );

  return {
    id: row.id,
    obraId: row.obra_id,
    autorId: row.autor_id,
    autorNome: row.autor_nome ?? "Fiscal",
    titulo: row.titulo,
    corpo: row.corpo ?? {},
    dataRegistro: row.data_registro.toISOString(),
    publicada: row.publicada,
    createdAt: row.created_at.toISOString(),
    midiaCount: midias.length,
    mencoes: mencoes.map((m) => ({ usuarioId: m.usuario_id, nome: m.nome })),
    midias: midias.map((m) => ({
      id: m.id,
      tipo: m.tipo as "imagem" | "video",
      urlStorage: m.url_storage,
      thumbnailUrl: m.thumbnail_url,
      tamanhoBytes: Number(m.tamanho_bytes),
      nomeOriginal: m.nome_original,
    })),
  };
}

export async function createCivilObraEntrada(
  schemaName: string,
  tenantId: string,
  autorId: string,
  input: CreateEntradaInput,
  publish = true,
): Promise<EntradaDetail> {
  await ensureTables(schemaName);
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${tEntradas(schemaName)} (
      id, obra_id, tenant_id, autor_id, titulo, corpo, data_registro, publicada
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::timestamptz,$8)`,
    id,
    input.obraId,
    tenantId,
    autorId,
    input.titulo.trim(),
    JSON.stringify(input.corpo ?? {}),
    input.dataRegistro,
    publish,
  );

  for (const usuarioId of input.mencaoUsuarioIds ?? []) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${tMencoes(schemaName)} (id, entrada_id, usuario_id, tenant_id)
       VALUES ($1,$2,$3,$4)`,
      randomUUID(),
      id,
      usuarioId,
      tenantId,
    );
  }

  for (const midia of input.midias ?? []) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${tMidias(schemaName)} (
        id, entrada_id, tenant_id, tipo, url_storage, thumbnail_url, tamanho_bytes, nome_original
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      randomUUID(),
      id,
      tenantId,
      midia.tipo,
      midia.urlStorage,
      midia.thumbnailUrl,
      midia.tamanhoBytes,
      midia.nomeOriginal,
    );
  }

  if (publish) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${tEventos(schemaName)} (
        id, obra_id, tenant_id, titulo, descricao, data_evento, tipo, entrada_id
      ) VALUES ($1,$2,$3,$4,$5,$6::timestamptz,'entrada',$7)`,
      randomUUID(),
      input.obraId,
      tenantId,
      input.titulo.trim(),
      "",
      input.dataRegistro,
      id,
    );
  }

  const detail = await getCivilObraEntrada(schemaName, tenantId, id);
  if (!detail) throw new Error("Falha ao criar entrada");
  return detail;
}

export async function listCivilObraUsuarios(
  schemaName: string,
  tenantId: string,
  obraId: string,
): Promise<UsuarioObraSummary[]> {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      nome: string;
      email: string;
      telefone: string | null;
      perfil: string;
      opt_in_whatsapp: boolean;
      revoked_at: Date | null;
    }[]
  >(
    `SELECT id, obra_id, nome, email, telefone, perfil, opt_in_whatsapp, revoked_at
     FROM ${tUsuarios(schemaName)}
     WHERE obra_id = $1 AND tenant_id = $2
     ORDER BY nome ASC`,
    obraId,
    tenantId,
  );
  return rows.map((r) => ({
    id: r.id,
    obraId: r.obra_id,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone,
    perfil: r.perfil as UsuarioObraPerfil,
    optInWhatsapp: r.opt_in_whatsapp,
    revokedAt: r.revoked_at?.toISOString() ?? null,
  }));
}

export async function inviteCivilObraUsuario(
  schemaName: string,
  tenantId: string,
  input: ConviteUsuarioInput,
): Promise<{ usuarioId: string; token: string; expiresAt: Date }> {
  await ensureTables(schemaName);
  const id = randomUUID();
  const token =
    randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${tUsuarios(schemaName)} (
      id, obra_id, tenant_id, nome, email, telefone, perfil,
      token_convite, token_expires_at, opt_in_whatsapp
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10)`,
    id,
    input.obraId,
    tenantId,
    input.nome.trim(),
    input.email.trim().toLowerCase(),
    input.telefone?.trim() ?? null,
    input.perfil,
    token,
    expiresAt,
    input.optInWhatsapp ?? false,
  );
  return { usuarioId: id, token, expiresAt };
}

export async function findCivilObraUsuarioByToken(
  schemaName: string,
  token: string,
) {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      tenant_id: string;
      nome: string;
      email: string;
      token_expires_at: Date | null;
      revoked_at: Date | null;
      senha_hash: string | null;
      session_version: number;
      perfil: string;
    }[]
  >(
    `SELECT * FROM ${tUsuarios(schemaName)} WHERE token_convite = $1`,
    token,
  );
  return rows[0] ?? null;
}

export async function acceptCivilObraInvite(
  schemaName: string,
  token: string,
  senha: string,
): Promise<{ ok: true; usuarioId: string; obraId: string; tenantId: string } | { ok: false; error: string }> {
  const row = await findCivilObraUsuarioByToken(schemaName, token);
  if (!row) return { ok: false, error: "Convite inválido" };
  if (row.revoked_at) return { ok: false, error: "Acesso revogado" };
  if (row.token_expires_at && row.token_expires_at < new Date()) {
    return { ok: false, error: "Convite expirado" };
  }
  const hash = await bcrypt.hash(senha, 10);
  await prisma.$executeRawUnsafe(
    `UPDATE ${tUsuarios(schemaName)}
     SET senha_hash = $1, token_convite = NULL, token_expires_at = NULL, updated_at = NOW()
     WHERE id = $2`,
    hash,
    row.id,
  );
  return { ok: true, usuarioId: row.id, obraId: row.obra_id, tenantId: row.tenant_id };
}

export async function authenticateCivilObraUsuario(
  schemaName: string,
  email: string,
  senha: string,
): Promise<
  | {
      id: string;
      obraId: string;
      tenantId: string;
      nome: string;
      perfil: UsuarioObraPerfil;
      sessionVersion: number;
    }
  | null
> {
  await ensureTables(schemaName);
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      tenant_id: string;
      nome: string;
      perfil: string;
      senha_hash: string | null;
      revoked_at: Date | null;
      session_version: number;
    }[]
  >(
    `SELECT * FROM ${tUsuarios(schemaName)}
     WHERE email = $1 AND senha_hash IS NOT NULL AND revoked_at IS NULL`,
    normalized,
  );
  for (const row of rows) {
    if (!row.senha_hash) continue;
    const match = await bcrypt.compare(senha, row.senha_hash);
    if (match) {
      return {
        id: row.id,
        obraId: row.obra_id,
        tenantId: row.tenant_id,
        nome: row.nome,
        perfil: row.perfil as UsuarioObraPerfil,
        sessionVersion: row.session_version,
      };
    }
  }
  return null;
}

export async function listObrasForObraUsuario(
  schemaName: string,
  tenantId: string,
  usuarioId: string,
): Promise<ObraSummary[]> {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<ObraRow[]>(
    `SELECT o.* FROM ${tObras(schemaName)} o
     JOIN ${tUsuarios(schemaName)} u ON u.obra_id = o.id
     WHERE u.id = $1 AND u.tenant_id = $2 AND o.soft_deleted_at IS NULL`,
    usuarioId,
    tenantId,
  );
  return rows.map(mapObra);
}

export async function revokeCivilObraUsuario(
  schemaName: string,
  tenantId: string,
  usuarioId: string,
): Promise<void> {
  await ensureTables(schemaName);
  await prisma.$executeRawUnsafe(
    `UPDATE ${tUsuarios(schemaName)}
     SET revoked_at = NOW(), session_version = session_version + 1, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $2`,
    usuarioId,
    tenantId,
  );
}

export async function listCivilObraEventos(
  schemaName: string,
  tenantId: string,
  obraId: string,
  range?: { start: string; end: string },
): Promise<EventoCalendario[]> {
  await ensureTables(schemaName);
  const params: unknown[] = [obraId, tenantId];
  let rangeClause = "";
  if (range) {
    rangeClause = " AND data_evento >= $3::timestamptz AND data_evento <= $4::timestamptz";
    params.push(range.start, range.end);
  }
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      titulo: string;
      descricao: string;
      data_evento: Date;
      tipo: string;
      entrada_id: string | null;
    }[]
  >(
    `SELECT * FROM ${tEventos(schemaName)}
     WHERE obra_id = $1 AND tenant_id = $2${rangeClause}
     ORDER BY data_evento ASC`,
    ...params,
  );
  return rows.map((r) => ({
    id: r.id,
    obraId: r.obra_id,
    titulo: r.titulo,
    descricao: r.descricao,
    dataEvento: r.data_evento.toISOString(),
    tipo: r.tipo as "marco" | "entrada",
    entradaId: r.entrada_id,
  }));
}

export async function buscarCivilObras(
  schemaName: string,
  tenantId: string,
  obraId: string,
  query: string,
): Promise<BuscaResultado> {
  await ensureTables(schemaName);
  const q = query.trim();
  if (!q) {
    return { entradas: [], obras: [], usuarios: [] };
  }
  const tsQuery = q.replace(/[^\w\s]/g, " ").trim();

  const entradas = await prisma.$queryRawUnsafe<
    {
      id: string;
      obra_id: string;
      autor_id: string;
      titulo: string;
      data_registro: Date;
      publicada: boolean;
      created_at: Date;
      midia_count: bigint;
    }[]
  >(
    `SELECT e.id, e.obra_id, e.autor_id, e.titulo, e.data_registro, e.publicada, e.created_at,
            COUNT(m.id)::bigint AS midia_count
     FROM ${tEntradas(schemaName)} e
     LEFT JOIN ${tMidias(schemaName)} m ON m.entrada_id = e.id
     WHERE e.tenant_id = $1 AND e.obra_id = $2
       AND to_tsvector('portuguese', coalesce(e.titulo,'') || ' ' || coalesce(e.corpo::text,''))
           @@ plainto_tsquery('portuguese', $3)
     GROUP BY e.id
     ORDER BY e.data_registro DESC
     LIMIT 50`,
    tenantId,
    obraId,
    tsQuery,
  );

  const usuarios = await listCivilObraUsuarios(schemaName, tenantId, obraId);
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  return {
    entradas: entradas.map((r) => ({
      id: r.id,
      obraId: r.obra_id,
      autorId: r.autor_id,
      autorNome: "",
      titulo: r.titulo,
      dataRegistro: r.data_registro.toISOString(),
      publicada: r.publicada,
      createdAt: r.created_at.toISOString(),
      midiaCount: Number(r.midia_count),
    })),
    obras: [],
    usuarios: usuariosFiltrados,
  };
}

export async function getRelatorioListagem(
  schemaName: string,
  tenantId: string,
  obraId: string,
  periodoInicio: string,
  periodoFim: string,
  autorId?: string,
): Promise<RelatorioListagem | null> {
  const obra = await getCivilObra(schemaName, tenantId, obraId);
  if (!obra) return null;
  await ensureTables(schemaName);
  let sql = `SELECT id FROM ${tEntradas(schemaName)}
    WHERE obra_id = $1 AND tenant_id = $2 AND publicada = true
      AND data_registro >= $3::timestamptz AND data_registro <= $4::timestamptz`;
  const params: unknown[] = [obraId, tenantId, periodoInicio, periodoFim];
  if (autorId) {
    sql += " AND autor_id = $5";
    params.push(autorId);
  }
  sql += " ORDER BY data_registro ASC";
  const ids = await prisma.$queryRawUnsafe<{ id: string }[]>(sql, ...params);
  const entradas: EntradaDetail[] = [];
  for (const { id } of ids) {
    const e = await getCivilObraEntrada(schemaName, tenantId, id);
    if (e) entradas.push(e);
  }
  return { obra, periodoInicio, periodoFim, entradas };
}

export async function saveCivilObraRelatorio(
  schemaName: string,
  tenantId: string,
  input: {
    obraId: string;
    periodoInicio: string;
    periodoFim: string;
    pdfUrl: string;
    geradoPor: string;
  },
): Promise<RelatorioGerado> {
  await ensureTables(schemaName);
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.$executeRawUnsafe(
    `INSERT INTO ${tRelatorios(schemaName)} (
      id, obra_id, tenant_id, periodo_inicio, periodo_fim, pdf_url, expires_at, gerado_por
    ) VALUES ($1,$2,$3,$4::date,$5::date,$6,$7::timestamptz,$8)`,
    id,
    input.obraId,
    tenantId,
    input.periodoInicio,
    input.periodoFim,
    input.pdfUrl,
    expiresAt,
    input.geradoPor,
  );
  return {
    id,
    obraId: input.obraId,
    periodoInicio: input.periodoInicio,
    periodoFim: input.periodoFim,
    pdfUrl: input.pdfUrl,
    expiresAt: expiresAt.toISOString(),
    geradoPor: input.geradoPor,
  };
}

export async function listUsuariosObraForNotificacao(
  schemaName: string,
  tenantId: string,
  obraId: string,
): Promise<
  { id: string; email: string; nome: string; telefone: string | null; optInWhatsapp: boolean }[]
> {
  await ensureTables(schemaName);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      email: string;
      nome: string;
      telefone: string | null;
      opt_in_whatsapp: boolean;
    }[]
  >(
    `SELECT id, email, nome, telefone, opt_in_whatsapp
     FROM ${tUsuarios(schemaName)}
     WHERE obra_id = $1 AND tenant_id = $2 AND revoked_at IS NULL`,
    obraId,
    tenantId,
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    nome: r.nome,
    telefone: r.telefone,
    optInWhatsapp: r.opt_in_whatsapp,
  }));
}
