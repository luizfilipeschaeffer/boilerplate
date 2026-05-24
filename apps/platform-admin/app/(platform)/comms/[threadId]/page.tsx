import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { CommsWorkspace } from "@/modules/platform-comms/comms-workspace";
import { loadCommsWorkspaceData } from "@/modules/platform-comms/load-comms-workspace-data";

export const dynamic = "force-dynamic";

export default async function CommsThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{
    organizationId?: string;
    platformLeadId?: string;
  }>;
}) {
  const { threadId } = await params;
  const session = await auth();
  const role = session?.user?.platformRole;
  if (!role || !canAccessPlatformModule(role, "platform-comms")) {
    return (
      <p className="px-4 text-sm text-muted-foreground">Sem permissão.</p>
    );
  }
  const filterParams = await searchParams;
  const canEdit = ["platform_admin", "platform_comercial", "platform_suporte"].includes(
    role,
  );

  const data = await loadCommsWorkspaceData(session?.user?.id, {
    threadId,
    organizationId: filterParams.organizationId,
    platformLeadId: filterParams.platformLeadId,
  });

  if (!data.activeThread) notFound();

  return (
    <CommsWorkspace
      threads={data.threads}
      activeThread={data.activeThread}
      canEdit={canEdit}
      currentUserId={session?.user?.id}
      filterOrgId={filterParams.organizationId}
      filterLeadId={filterParams.platformLeadId}
      organizations={data.organizations}
      leads={data.leads}
      platformUsers={data.platformUsers}
    />
  );
}
