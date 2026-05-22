import { AtivacoesProvisioningView } from "@/modules/platform-segmentos/ativacoes-provisioning-view";
import { loadActivationsList } from "@/modules/platform-segmentos/actions";

export default async function SegmentosAtivacoesPage() {
  const { ativacoes } = await loadActivationsList();
  return <AtivacoesProvisioningView ativacoes={ativacoes} />;
}
