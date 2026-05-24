import { auth } from "@/auth";
import {
  assertActiveMembership,
  getTenantSyncIds,
  getTenantSyncSnapshot,
} from "@boilerplate/db";
import {
  collectAllowedCorsOrigins,
  corsHeadersForRequest,
  handleCorsPreflight,
} from "@boilerplate/shared/security";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const preflight = handleCorsPreflight(origin, collectAllowedCorsOrigins());
  return preflight ?? new Response(null, { status: 403 });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const cors = corsHeadersForRequest(origin, collectAllowedCorsOrigins());

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || session?.needsOnboarding) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401, headers: cors });
  }

  let membership;
  try {
    membership = await assertActiveMembership(userId);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401, headers: cors });
  }

  const url = new URL(req.url);
  const sinceRaw = url.searchParams.get("since");
  const reconcile = url.searchParams.get("reconcile") === "1";
  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (sinceRaw && Number.isNaN(since!.getTime())) {
    return NextResponse.json({ error: "Parâmetro since inválido" }, { status: 400, headers: cors });
  }

  const snapshot = await getTenantSyncSnapshot(membership.schemaName, since);
  const ids = reconcile ? await getTenantSyncIds(membership.schemaName) : undefined;

  return NextResponse.json(
    {
      revision: snapshot.revision,
      syncedAt: snapshot.syncedAt,
      clients: snapshot.clients,
      catalog: snapshot.catalog,
      stock: snapshot.stock,
      sales: snapshot.sales,
      ids,
    },
    { headers: cors },
  );
}
