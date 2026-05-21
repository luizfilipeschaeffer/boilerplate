import { listCatalogAction } from "@/app/actions/catalog";
import { CatalogForm } from "@/components/catalog-form";
import { CatalogList } from "@/components/catalog-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CatalogoPage() {
  const items = await listCatalogAction();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Catálogo</h2>
        <p className="text-sm text-muted-foreground">
          Produtos e serviços — dados no schema do seu tenant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo item</CardTitle>
          <CardDescription>Cadastro genérico (Fase 1)</CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <CatalogList items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
