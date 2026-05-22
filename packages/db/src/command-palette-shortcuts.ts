import { prisma } from "./client";

export const DEFAULT_COMMAND_SHORTCUT_IDS = [
  "action:catalogo-novo",
  "action:cliente-novo",
  "action:venda-nova",
] as const;

export const VALID_COMMAND_SHORTCUT_IDS = new Set<string>([
  "action:catalogo-novo",
  "action:cliente-novo",
  "action:venda-nova",
  "action:estoque-movimento",
  "nav:/dashboard",
  "nav:/catalogo",
  "nav:/clientes",
  "nav:/vendas",
  "nav:/estoque/produtos",
  "nav:/estoque/movimentacao",
]);

export function parseCommandShortcutIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_COMMAND_SHORTCUT_IDS];
  const parsed = raw
    .map(String)
    .filter((id) => VALID_COMMAND_SHORTCUT_IDS.has(id));
  return parsed.length > 0 ? parsed : [...DEFAULT_COMMAND_SHORTCUT_IDS];
}

export async function getSectorCommandPaletteShortcuts(
  organizationId: string,
  sectorSlug: string,
): Promise<string[]> {
  const sector = await prisma.sector.findFirst({
    where: { organizationId, slug: sectorSlug },
    select: { commandPaletteShortcuts: true },
  });
  if (!sector) return [...DEFAULT_COMMAND_SHORTCUT_IDS];
  return parseCommandShortcutIds(sector.commandPaletteShortcuts);
}

export async function saveSectorCommandPaletteShortcuts(
  organizationId: string,
  sectorSlug: string,
  shortcutIds: string[],
): Promise<string[]> {
  const unique = [...new Set(shortcutIds)].filter((id) =>
    VALID_COMMAND_SHORTCUT_IDS.has(id),
  );
  if (unique.length === 0) {
    throw new Error("Selecione ao menos um atalho.");
  }

  await prisma.sector.update({
    where: {
      organizationId_slug: { organizationId, slug: sectorSlug },
    },
    data: { commandPaletteShortcuts: unique },
  });

  return unique;
}

export async function getMembershipCommandPaletteShortcuts(
  userId: string,
  organizationId: string,
): Promise<string[] | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { commandPaletteShortcuts: true },
  });
  if (!membership?.commandPaletteShortcuts) return null;
  const parsed = parseCommandShortcutIds(membership.commandPaletteShortcuts);
  return parsed;
}

export async function saveMembershipCommandPaletteShortcuts(
  userId: string,
  organizationId: string,
  shortcutIds: string[] | null,
): Promise<string[] | null> {
  if (shortcutIds === null) {
    await prisma.membership.update({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      data: { commandPaletteShortcuts: null },
    });
    return null;
  }

  const unique = [...new Set(shortcutIds)].filter((id) =>
    VALID_COMMAND_SHORTCUT_IDS.has(id),
  );
  if (unique.length === 0) {
    throw new Error("Selecione ao menos um atalho.");
  }

  await prisma.membership.update({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    data: { commandPaletteShortcuts: unique },
  });

  return unique;
}

export async function getEffectiveCommandPaletteShortcuts(
  userId: string,
  organizationId: string,
  sectorSlug: string,
): Promise<{
  sectorShortcuts: string[];
  userShortcuts: string[] | null;
  effectiveShortcuts: string[];
}> {
  const [sectorShortcuts, userShortcuts] = await Promise.all([
    getSectorCommandPaletteShortcuts(organizationId, sectorSlug),
    getMembershipCommandPaletteShortcuts(userId, organizationId),
  ]);
  const effectiveShortcuts = userShortcuts ?? sectorShortcuts;
  return { sectorShortcuts, userShortcuts, effectiveShortcuts };
}
