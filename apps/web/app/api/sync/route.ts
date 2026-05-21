import { auth } from "@/auth";
import {
  getOrganizationById,
  getTenantSyncIds,
  getTenantSyncSnapshot,
} from "@boilerplate/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.organizationId || session.needsOnboarding) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const org = await getOrganizationById(session.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  }

  const url = new URL(req.url);
  const sinceRaw = url.searchParams.get("since");
  const reconcile = url.searchParams.get("reconcile") === "1";
  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (sinceRaw && Number.isNaN(since!.getTime())) {
    return NextResponse.json({ error: "Parâmetro since inválido" }, { status: 400 });
  }

  const snapshot = await getTenantSyncSnapshot(org.schemaName, since);

  const ids = reconcile ? await getTenantSyncIds(org.schemaName) : undefined;

  return NextResponse.json({
    revision: snapshot.revision,
    syncedAt: snapshot.syncedAt,
    clients: snapshot.clients,
    catalog: snapshot.catalog,
    stock: snapshot.stock,
    sales: snapshot.sales,
    ids,
  });
}
