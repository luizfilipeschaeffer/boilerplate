import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProvisioningBanner } from "@/components/provisioning-banner";
import { SyncProvider } from "@/components/sync-provider";
import {
  getActiveModuleIds,
  getDashboardNav,
} from "@/lib/modules/active-modules";
import { ensureServerModulesInitialized } from "@/lib/modules/init-server";
import { resolveUserSetup } from "@/lib/session-setup";
import { redirect } from "next/navigation";

ensureServerModulesInitialized();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const setup = await resolveUserSetup(session.user.id);
  if (!setup.hasOrganization) redirect("/onboarding");

  const orgId = setup.organizationId ?? session.organizationId;
  if (!orgId) redirect("/onboarding");

  const sectorId = session.sectorId ?? "geral";
  const userRole = session.role ?? "dono";

  const [navItems, activeModuleIds] = await Promise.all([
    getDashboardNav(orgId, sectorId, userRole, session.user.id),
    getActiveModuleIds(orgId, sectorId, userRole, session.user.id),
  ]);

  const user = {
    name: session.user?.name ?? "Usuário",
    email: session.user?.email ?? "",
  };

  return (
    <SyncProvider organizationId={orgId}>
      <DashboardShell
        navItems={navItems}
        activeModuleIds={activeModuleIds}
        user={user}
        role={userRole}
        branchId={session.branchId}
        sectorId={sectorId}
      >
        <ProvisioningBanner />
        {children}
      </DashboardShell>
    </SyncProvider>
  );
}
