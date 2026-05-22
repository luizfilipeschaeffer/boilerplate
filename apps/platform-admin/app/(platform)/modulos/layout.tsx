import { Card, CardContent } from "@/components/ui/card";
import { loadModulosAccess } from "@/modules/platform-modulos/load-modulos-page-data";
import { ModulosPageHeaderInfo } from "@/modules/platform-modulos/modulos-page-header-info";

export default async function ModulosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canEdit = await loadModulosAccess();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <ModulosPageHeaderInfo readOnly={!canEdit} />
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
