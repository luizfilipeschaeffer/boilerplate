import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CommsPage() {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Comunicação</CardTitle>
          <CardDescription>
            Omnichannel interno — e-mail, chat e notificações (PRD §17.3).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Módulo em construção — fila unificada e templates serão adicionados em
          seguida.
        </CardContent>
      </Card>
    </div>
  );
}
