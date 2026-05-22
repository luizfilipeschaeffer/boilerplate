import { loadModulosBundlesData } from "@/modules/platform-modulos/load-modulos-page-data";
import { ModulosBundlesView } from "@/modules/platform-modulos/modulos-bundles-view";

export const dynamic = "force-dynamic";

export default async function ModulosBundlesPage() {
  const { modules, bundles, canEdit } = await loadModulosBundlesData();

  return (
    <ModulosBundlesView modules={modules} bundles={bundles} canEdit={canEdit} />
  );
}
