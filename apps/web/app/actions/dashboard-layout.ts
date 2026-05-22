"use server";

import { auth } from "@/auth";
import {
  getSectorDashboardCards,
  listSectors,
  saveSectorDashboardCards,
} from "@boilerplate/db";
import {
  DASHBOARD_CARD_CATALOG,
  type DashboardCardId,
  parseDashboardCardIds,
} from "@/lib/dashboard-cards";
import { revalidatePath } from "next/cache";

async function requireDashboardEditor() {
  const session = await auth();
  const orgId = session?.organizationId;
  const role = session?.role ?? "dono";
  if (!orgId) throw new Error("Organização não disponível");
  if (role !== "dono" && role !== "gerente") {
    throw new Error("Sem permissão para editar o painel");
  }
  return { orgId, session };
}

export async function listDashboardSectorsAction() {
  const { orgId } = await requireDashboardEditor();
  const sectors = await listSectors(orgId);
  return sectors.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
  }));
}

export async function getDashboardLayoutAction(sectorSlug: string) {
  const { orgId } = await requireDashboardEditor();
  const cards = await getSectorDashboardCards(orgId, sectorSlug);
  return {
    sectorSlug,
    cards: parseDashboardCardIds(cards),
    catalog: DASHBOARD_CARD_CATALOG,
  };
}

export async function saveDashboardLayoutAction(
  sectorSlug: string,
  cardIds: DashboardCardId[],
) {
  const { orgId } = await requireDashboardEditor();
  const saved = await saveSectorDashboardCards(orgId, sectorSlug, cardIds);
  revalidatePath("/dashboard");
  return { cards: parseDashboardCardIds(saved) };
}
