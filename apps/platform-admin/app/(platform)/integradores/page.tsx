import { IntegradoresListView } from "@/modules/platform-integradores/integradores-list-view";
import { loadIntegradoresCatalogData } from "@/modules/platform-integradores/actions";

export default async function IntegradoresPage() {
  const { integrators, canEditGateways } = await loadIntegradoresCatalogData();
  return (
    <IntegradoresListView
      integrators={integrators}
      canEditGateways={canEditGateways}
    />
  );
}
