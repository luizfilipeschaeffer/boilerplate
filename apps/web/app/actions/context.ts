"use server";

import { auth } from "@/auth";
import {
  listBranches,
  listSectorsAccessibleToUser,
  userCanAccessSector,
} from "@boilerplate/db";

export async function listContextOptionsAction() {
  const session = await auth();
  const orgId = session?.organizationId;
  const userId = session?.user?.id;
  if (!orgId || !userId) return { branches: [], sectors: [] };

  const [branches, sectors] = await Promise.all([
    listBranches(orgId),
    listSectorsAccessibleToUser(userId, orgId),
  ]);

  let sectorId = session?.sectorId ?? "geral";
  const allowed = await userCanAccessSector(userId, orgId, sectorId);
  if (!allowed && sectors[0]) {
    sectorId = sectors[0].slug;
  }

  return {
    branches: branches.filter((b) => b.active),
    sectors,
    branchId: session?.branchId ?? null,
    sectorId,
  };
}
