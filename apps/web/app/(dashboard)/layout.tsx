import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardNav } from "@/lib/modules/active-modules";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const orgId = (session as { organizationId?: string }).organizationId;
  const navItems = await getDashboardNav(orgId);

  const user = {
    name: session.user?.name ?? "Usuário",
    email: session.user?.email ?? "",
  };

  return (
    <DashboardShell navItems={navItems} user={user}>
      {children}
    </DashboardShell>
  );
}
