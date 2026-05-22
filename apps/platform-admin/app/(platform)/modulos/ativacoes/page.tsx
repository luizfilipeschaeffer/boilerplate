import { loadModulosAtivacoesData } from "@/modules/platform-modulos/load-modulos-page-data";
import { ModulosAtivacoesView } from "@/modules/platform-modulos/modulos-ativacoes-view";

export const dynamic = "force-dynamic";

export default async function ModulosAtivacoesPage() {
  const { ativacoes } = await loadModulosAtivacoesData();

  return <ModulosAtivacoesView ativacoes={ativacoes} />;
}
