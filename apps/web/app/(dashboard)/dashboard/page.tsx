import { auth } from "@/auth";
import { DashboardHome } from "@/components/dashboard-home";
import { syncAndLoadMissions } from "@/app/actions/missions";
import { getOrganizationById } from "@boilerplate/db";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.organizationId;
  if (!orgId) redirect("/onboarding");

  const org = await getOrganizationById(orgId);
  if (!org) redirect("/onboarding");

  const { completedIds } = await syncAndLoadMissions();

  return (
    <DashboardHome
      userName={session.user.name ?? "Usuário"}
      organizationName={org.name}
      completedIds={completedIds}
    />
  );
}
