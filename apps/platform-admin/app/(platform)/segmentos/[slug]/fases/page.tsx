import { SegmentoFasesView } from "@/modules/platform-segmentos/segmento-fases-view";
import { loadSegmentPhasesData } from "@/modules/platform-segmentos/actions";

export default async function SegmentoFasesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { segment, phases, modules, canEdit } = await loadSegmentPhasesData(slug);
  return (
    <SegmentoFasesView
      segment={segment}
      phases={phases}
      modules={modules}
      canEdit={canEdit}
    />
  );
}
