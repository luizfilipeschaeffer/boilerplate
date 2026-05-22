import { auth } from "@/auth";
import { getDashboardOverviewAction } from "@/app/actions/dashboard";
import { DashboardHome } from "@/components/dashboard-home";
import { syncAndLoadMissions } from "@/app/actions/missions";
import { FASE1_MISSIONS } from "@/lib/missions/catalog";
import {
  parseDashboardCardIds,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
import { getOrganizationById, getSectorDashboardCards } from "@boilerplate/db";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.organizationId;
  if (!orgId) redirect("/onboarding");

  const org = await getOrganizationById(orgId);
  if (!org) redirect("/onboarding");

  const { completedIds } = await syncAndLoadMissions();
  const allDone = FASE1_MISSIONS.every((m) => completedIds.includes(m.id));
  const overview = allDone ? await getDashboardOverviewAction() : null;

  const sectorSlug = session.sectorId ?? "geral";
  const role = session.role ?? "dono";
  const canEditDashboard = role === "dono" || role === "gerente";
  const rawCards = await getSectorDashboardCards(orgId, sectorSlug);
  const enabledCards: DashboardCardId[] = parseDashboardCardIds(rawCards);

  return (
    <DashboardHome
      userName={session.user.name ?? "Usuário"}
      organizationName={org.name}
      completedIds={completedIds}
      overview={overview}
      enabledCards={enabledCards}
      canEditDashboard={canEditDashboard}
      sectorSlug={sectorSlug}
    />
  );
}
