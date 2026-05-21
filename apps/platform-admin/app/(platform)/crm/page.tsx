import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CrmPage() {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM da plataforma</CardTitle>
          <CardDescription>
            Pipeline de leads, contas SaaS e renovações (PRD §17.2).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Módulo em construção — integração com organizações e histórico de
          contato virá na próxima iteração.
        </CardContent>
      </Card>
    </div>
  );
}
