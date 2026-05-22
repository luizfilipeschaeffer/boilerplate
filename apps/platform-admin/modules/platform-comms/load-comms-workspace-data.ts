import {
  getCommsThread,
  listCommsThreads,
  listOrganizationsForAdmin,
  listPlatformUsersForComms,
  prisma,
} from "@boilerplate/db";

export async function loadCommsWorkspaceData(
  platformUserId: string | undefined,
  options?: {
    threadId?: string;
    organizationId?: string;
    platformLeadId?: string;
  },
) {
  const [threads, orgs, leads, platformUsers, activeThread] = await Promise.all([
    listCommsThreads({
      organizationId: options?.organizationId,
      platformLeadId: options?.platformLeadId,
    }),
    listOrganizationsForAdmin(),
    prisma.platformLead.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listPlatformUsersForComms(platformUserId),
    options?.threadId ? getCommsThread(options.threadId) : Promise.resolve(null),
  ]);

  return {
    threads,
    activeThread,
    organizations: orgs.map((o) => ({ id: o.id, name: o.name })),
    leads,
    platformUsers,
  };
}
