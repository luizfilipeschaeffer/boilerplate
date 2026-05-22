import { loadModulosCatalogoData } from "@/modules/platform-modulos/load-modulos-page-data";
import { ModulosCatalogoView } from "@/modules/platform-modulos/modulos-catalogo-view";

export const dynamic = "force-dynamic";

export default async function ModulosCatalogoPage() {
  const { modules, precos, canEdit } = await loadModulosCatalogoData();

  return (
    <ModulosCatalogoView modules={modules} precos={precos} canEdit={canEdit} />
  );
}
