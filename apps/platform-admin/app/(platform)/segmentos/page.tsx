import { SegmentosListView } from "@/modules/platform-segmentos/segmentos-list-view";
import { loadSegmentsList } from "@/modules/platform-segmentos/actions";

export default async function SegmentosPage() {
  const { segments, canEdit } = await loadSegmentsList();
  return <SegmentosListView segments={segments} canEdit={canEdit} />;
}
