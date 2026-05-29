import type { Release } from "@boilerplate/platform-api";
import { prisma } from "../client";

export async function listReleasesForTarget(opts: {
  targetType: string;
  targetId?: string;
}): Promise<Release[]> {
  const rows = await prisma.releaseCatalog.findMany({
    where: {
      targetType: opts.targetType,
      ...(opts.targetId ? { targetId: opts.targetId } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    targetType: r.targetType as Release["targetType"],
    targetId: r.targetId,
    version: r.version,
    compatibility: r.compatibility as Release["compatibility"],
    changelog: r.changelog,
    migrations: (r.migrationIds as string[]) ?? [],
    publishedBy: r.publishedBy,
    publishedAt: r.publishedAt,
  }));
}

export async function seedDefaultPlatformRelease(version: string): Promise<void> {
  await prisma.releaseCatalog.upsert({
    where: {
      targetType_targetId_version: {
        targetType: "platform",
        targetId: "boilerplate",
        version,
      },
    },
    create: {
      targetType: "platform",
      targetId: "boilerplate",
      version,
      compatibility: {
        minPlatformVersion: version,
        sdkContractVersion: "3.0.0",
      },
      changelog: "Release inicial self-hosted",
      migrationIds: [],
      publishedBy: "system",
    },
    update: {},
  });
}
