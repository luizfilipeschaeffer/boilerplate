import { SectionCards } from "@/components/section-cards";
import { getActiveModuleIds } from "@/lib/modules/active-modules";

export default async function DashboardPage() {
  const modulos = await getActiveModuleIds();

  return <SectionCards moduleCount={modulos.length} />;
}
