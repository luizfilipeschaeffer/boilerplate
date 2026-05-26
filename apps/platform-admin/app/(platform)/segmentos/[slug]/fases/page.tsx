import { SegmentoFasesView } from "@/modules/platform-segmentos/segmento-fases-view";
import { loadSegmentPhasesData } from "@/modules/platform-segmentos/actions";

export default async function SegmentoFasesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadSegmentPhasesData(slug);
  return (
    <SegmentoFasesView
      segment={data.segment}
      phases={data.phases}
      sectorTemplates={data.sectorTemplates}
      moduleTemplates={data.moduleTemplates}
      modules={data.modules}
      canEdit={data.canEdit}
    />
  );
}
