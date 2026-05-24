import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";
import { CommsWorkspace } from "@/modules/platform-comms/comms-workspace";
import { loadCommsWorkspaceData } from "@/modules/platform-comms/load-comms-workspace-data";

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
  const role = session?.user?.platformRole;
  if (!role || !canAccessPlatformModule(role, "platform-comms")) {
    return (
      <p className="px-4 text-sm text-muted-foreground">Sem permissão.</p>
    );
  }

  const canEdit = ["platform_admin", "platform_comercial", "platform_suporte"].includes(
    role,
  );
  const params = await searchParams;

  const data = await loadCommsWorkspaceData(session?.user?.id, {
    organizationId: params.organizationId,
    platformLeadId: params.platformLeadId,
  });

  return (
    <CommsWorkspace
      threads={data.threads}
      activeThread={null}
      canEdit={canEdit}
      currentUserId={session?.user?.id}
      filterOrgId={params.organizationId}
      filterLeadId={params.platformLeadId}
      organizations={data.organizations}
      leads={data.leads}
      platformUsers={data.platformUsers}
    />
  );
}
