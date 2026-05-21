import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { SyncProvider } from "@/components/sync-provider";
import { getDashboardNav } from "@/lib/modules/active-modules";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { redirect } from "next/navigation";

ensureModulesRegistered();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const orgId = (session as { organizationId?: string }).organizationId;
  if (!orgId) redirect("/onboarding");

  const navItems = await getDashboardNav(orgId);

  const user = {
    name: session.user?.name ?? "Usuário",
    email: session.user?.email ?? "",
  };

  return (
    <SyncProvider organizationId={orgId}>
      <DashboardShell navItems={navItems} user={user}>
        {children}
      </DashboardShell>
    </SyncProvider>
  );
}
