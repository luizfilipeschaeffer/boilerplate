import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { SyncProvider } from "@/components/sync-provider";
import { getDashboardNav } from "@/lib/modules/active-modules";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { resolveUserSetup } from "@/lib/session-setup";
import { redirect } from "next/navigation";

ensureModulesRegistered();

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

  const navItems = await getDashboardNav(
    orgId,
    session.sectorId ?? "geral",
    session.role ?? "dono",
    session.user.id,
  );

  const user = {
    name: session.user?.name ?? "Usuário",
    email: session.user?.email ?? "",
  };

  return (
    <SyncProvider organizationId={orgId}>
      <DashboardShell
        navItems={navItems}
        user={user}
        role={session.role ?? "dono"}
      >
        {children}
      </DashboardShell>
    </SyncProvider>
  );
}
