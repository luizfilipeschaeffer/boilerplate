import {
  listCommsThreads,
  listOrganizationsForAdmin,
  prisma,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";
import type { PlatformRole } from "@boilerplate/db";
import { CommsInboxClient } from "@/modules/platform-comms/comms-inbox-client";

export const dynamic = "force-dynamic";

export default async function CommsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string;
    platformLeadId?: string;
  }>;
}) {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_suporte") as PlatformRole;
  const canEdit = ["platform_admin", "platform_comercial", "platform_suporte"].includes(
    role,
  );
  const params = await searchParams;

  const [threads, orgs, leads] = await Promise.all([
    listCommsThreads({
      organizationId: params.organizationId,
      platformLeadId: params.platformLeadId,
    }),
    listOrganizationsForAdmin(),
    prisma.platformLead.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="px-4 pb-8 lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Comunicação</h1>
        <p className="text-sm text-muted-foreground">
          Inbox omnichannel — MVP com e-mail mock e vínculo ao CRM (tipo + fase).
        </p>
      </div>
      {canAccessPlatformModule(role, "platform-comms") ? (
        <CommsInboxClient
          threads={threads}
          canEdit={canEdit}
          filterOrgId={params.organizationId}
          filterLeadId={params.platformLeadId}
          organizations={orgs.map((o) => ({ id: o.id, name: o.name }))}
          leads={leads}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Sem permissão.</p>
      )}
    </div>
  );
}
