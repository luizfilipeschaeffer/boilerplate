import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityPublicationsView } from "@/modules/platform-comunidade/community-publications-view";
import { loadCommunityPublicationsData } from "@/modules/platform-comunidade/actions";

export default async function ComunidadePage() {
  const { publications, canModerate } = await loadCommunityPublicationsData();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Publicações da comunidade</CardTitle>
      </CardHeader>
      <Card>
        <CardContent className="pt-6">
          <CommunityPublicationsView
            publications={publications}
            canModerate={canModerate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
