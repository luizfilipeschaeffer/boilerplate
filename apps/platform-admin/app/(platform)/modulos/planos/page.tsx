import { loadModulosPlanosData } from "@/modules/platform-modulos/load-modulos-page-data";
import { ModulosPlanosView } from "@/modules/platform-modulos/modulos-planos-view";

export const dynamic = "force-dynamic";

export default async function ModulosPlanosPage() {
  const { modules, planos, canEdit } = await loadModulosPlanosData();

  return (
    <ModulosPlanosView modules={modules} planos={planos} canEdit={canEdit} />
  );
}
