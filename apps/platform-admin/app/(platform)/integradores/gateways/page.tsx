import { GatewaysView } from "@/modules/platform-integradores/gateways-view";
import { loadGatewaysData } from "@/modules/platform-integradores/actions";

export default async function GatewaysPage() {
  const { gateways, canEdit } = await loadGatewaysData();
  return <GatewaysView gateways={gateways} canEdit={canEdit} />;
}
