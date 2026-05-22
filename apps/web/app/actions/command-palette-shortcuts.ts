"use server";

import { auth } from "@/auth";
import {
  getEffectiveCommandPaletteShortcuts,
  getSectorCommandPaletteShortcuts,
  listSectors,
  saveMembershipCommandPaletteShortcuts,
  saveSectorCommandPaletteShortcuts,
} from "@boilerplate/db";
import { shortcutsCatalogByGroup } from "@/lib/command-palette/shortcuts-catalog";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  const userId = session?.user?.id;
  const orgId = session?.organizationId;
  if (!userId || !orgId) throw new Error("Sessão inválida.");
  return {
    userId,
    orgId,
    role: session.role ?? "dono",
    sectorSlug: session.sectorId ?? "geral",
  };
}

function canEditSectorShortcuts(role: string) {
  return role === "dono" || role === "gerente";
}

export async function getCommandPaletteShortcutsAction(sectorSlug?: string) {
  const { userId, orgId, role, sectorSlug: sessionSector } = await requireSession();
  const slug = sectorSlug ?? sessionSector;
  const [layout, activeModuleIds] = await Promise.all([
    getEffectiveCommandPaletteShortcuts(userId, orgId, slug),
    getActiveModuleIds(orgId, slug, role, userId),
  ]);

  return {
    sectorSlug: slug,
    sectorShortcuts: layout.sectorShortcuts,
    userShortcuts: layout.userShortcuts,
    effectiveShortcuts: layout.effectiveShortcuts,
    catalogGroups: shortcutsCatalogByGroup(activeModuleIds),
    canEditSector: canEditSectorShortcuts(role),
    hasPersonalOverride: layout.userShortcuts !== null,
  };
}

export async function listCommandPaletteSectorsAction() {
  const { orgId, role } = await requireSession();
  if (!canEditSectorShortcuts(role)) {
    throw new Error("Sem permissão para editar atalhos do setor.");
  }
  const sectors = await listSectors(orgId);
  return sectors.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
  }));
}

export async function getSectorCommandPaletteShortcutsAction(sectorSlug: string) {
  const { orgId, role } = await requireSession();
  if (!canEditSectorShortcuts(role)) {
    throw new Error("Sem permissão para editar atalhos do setor.");
  }
  const shortcuts = await getSectorCommandPaletteShortcuts(orgId, sectorSlug);
  return { sectorSlug, shortcuts };
}

export async function saveUserCommandPaletteShortcutsAction(shortcutIds: string[]) {
  const { userId, orgId, sectorSlug } = await requireSession();
  const saved = await saveMembershipCommandPaletteShortcuts(
    userId,
    orgId,
    shortcutIds,
  );
  revalidatePath("/", "layout");
  return { shortcuts: saved, sectorSlug };
}

export async function resetUserCommandPaletteShortcutsAction() {
  const { userId, orgId, sectorSlug } = await requireSession();
  await saveMembershipCommandPaletteShortcuts(userId, orgId, null);
  const layout = await getEffectiveCommandPaletteShortcuts(
    userId,
    orgId,
    sectorSlug,
  );
  revalidatePath("/", "layout");
  return { shortcuts: layout.effectiveShortcuts };
}

export async function saveSectorCommandPaletteShortcutsAction(
  sectorSlug: string,
  shortcutIds: string[],
) {
  const { orgId, role } = await requireSession();
  if (!canEditSectorShortcuts(role)) {
    throw new Error("Sem permissão para editar atalhos do setor.");
  }
  const saved = await saveSectorCommandPaletteShortcuts(
    orgId,
    sectorSlug,
    shortcutIds,
  );
  revalidatePath("/", "layout");
  return { sectorSlug, shortcuts: saved };
}
