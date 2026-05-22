import type { DashboardOverview } from "@/app/actions/dashboard";
import { DashboardHomeClient } from "@/components/dashboard-home-client";
import type { DashboardCardId } from "@/lib/dashboard-cards";

export function DashboardHome({
  userName,
  organizationName,
  completedIds,
  overview,
  enabledCards,
  canEditDashboard,
  sectorSlug,
}: {
  userName: string;
  organizationName: string;
  completedIds: string[];
  overview: DashboardOverview | null;
  enabledCards: DashboardCardId[];
  canEditDashboard: boolean;
  sectorSlug: string;
}) {
  return (
    <DashboardHomeClient
      userName={userName}
      organizationName={organizationName}
      completedIds={completedIds}
      overview={overview}
      enabledCards={enabledCards}
      canEditDashboard={canEditDashboard}
      sectorSlug={sectorSlug}
    />
  );
}
