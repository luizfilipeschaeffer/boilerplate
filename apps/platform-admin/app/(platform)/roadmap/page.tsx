import {
  getPlatformDepthSummary,
  getPublicChangelog,
  getRoadmapBySector,
} from "@boilerplate/db";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoadmapClient } from "@/modules/platform-roadmap/roadmap-client";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const [sectors, changelog, summary] = await Promise.all([
    getRoadmapBySector(),
    getPublicChangelog(20),
    getPlatformDepthSummary(),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Roadmap de produto</CardTitle>
          <CardDescription>
            Setores core, profundidade D e changelog — PRD §17.8 / §8.12.
          </CardDescription>
        </CardHeader>
      </Card>
      <RoadmapClient sectors={sectors} changelog={changelog} summary={summary} />
    </div>
  );
}
