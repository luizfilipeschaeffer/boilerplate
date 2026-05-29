import { listAllInstallations } from "@boilerplate/db/self-hosted";
import { listOrganizationsForAdmin } from "@boilerplate/db";
import {
  PlatformInstallationsView,
  type InstallationTableRow,
} from "@/components/platform-installations-view";

export const dynamic = "force-dynamic";

export default async function InstalacoesPage() {
  const [installations, organizations] = await Promise.all([
    listAllInstallations(),
    listOrganizationsForAdmin(),
  ]);

  const rows: InstallationTableRow[] = installations.map((inst) => ({
    id: inst.id,
    name: inst.name,
    status: inst.status,
    version: inst.version,
    lastHeartbeatAt: inst.lastHeartbeatAt?.toISOString() ?? null,
    publicUrl: inst.publicUrl,
    organizationId: inst.organizationId,
    organizationName: inst.organization.name,
    organizationSlug: inst.organization.slug,
  }));

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <PlatformInstallationsView
        installations={rows}
        organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  );
}
