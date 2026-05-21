import { EstoqueCachedView } from "@/components/cached/estoque-view";
import { MissionVisitTracker } from "@/components/mission-visit-tracker";

export default function EstoquePage() {
  return (
    <>
      <MissionVisitTracker missionId="ver_estoque" />
      <EstoqueCachedView />
    </>
  );
}
