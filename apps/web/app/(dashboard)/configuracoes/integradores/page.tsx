import { loadTenantIntegratorsPage } from "@/app/actions/integrator-credentials";
import { TenantIntegratorsView } from "@/components/tenant-integrators-view";

export default async function ConfigIntegradoresPage() {
  const { integrators, canEdit } = await loadTenantIntegratorsPage();
  return (
    <TenantIntegratorsView integrators={integrators} canEdit={canEdit} />
  );
}
