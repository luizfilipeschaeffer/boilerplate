"use server";

import { getCivilObraObraSession } from "@/app/actions/civil-obras";
import {
  createCivilObraEntrada,
  getCivilObraEntrada,
  listCivilObraEntradas,
  listCivilObraEventos,
} from "@boilerplate/db";

async function requireObraSession(obraId: string) {
  const session = await getCivilObraObraSession();
  if (!session || session.obraId !== obraId) {
    throw new Error("Sessão de obra inválida");
  }
  if (session.perfil === "visualizador") {
    throw new Error("Somente leitura");
  }
  return session;
}

export async function listEntradasObraSessionAction(obraId: string) {
  const session = await getCivilObraObraSession();
  if (!session || session.obraId !== obraId) throw new Error("Sessão inválida");
  return listCivilObraEntradas(
    session.schemaName,
    session.tenantId,
    obraId,
  );
}

export async function createEntradaObraSessionAction(input: {
  obraId: string;
  titulo: string;
  corpo: Record<string, unknown>;
  dataRegistro: string;
}) {
  const session = await requireObraSession(input.obraId);
  return createCivilObraEntrada(
    session.schemaName,
    session.tenantId,
    session.usuarioId,
    {
      obraId: input.obraId,
      titulo: input.titulo,
      corpo: input.corpo,
      dataRegistro: input.dataRegistro,
    },
    true,
  );
}

export async function listEventosObraSessionAction(
  obraId: string,
  range: { start: string; end: string },
) {
  const session = await getCivilObraObraSession();
  if (!session || session.obraId !== obraId) throw new Error("Sessão inválida");
  return listCivilObraEventos(
    session.schemaName,
    session.tenantId,
    obraId,
    range,
  );
}

export async function getEntradaObraSessionAction(entradaId: string) {
  const session = await getCivilObraObraSession();
  if (!session) throw new Error("Sessão inválida");
  return getCivilObraEntrada(session.schemaName, session.tenantId, entradaId);
}
