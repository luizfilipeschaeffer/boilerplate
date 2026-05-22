import { MessageSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Comunicação",
};

/**
 * Placeholder do módulo tenant omnichannel (core-comms).
 * UI completa espelha platform-admin/comms-workspace (3 colunas).
 */
export default function ComunicacaoPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-muted-foreground" />
            <CardTitle>Comunicação omnichannel</CardTitle>
          </div>
          <CardDescription>
            Em breve: chat interno entre membros da sua empresa (todos os setores e
            filiais) e conversas com clientes via WhatsApp, Telegram e e-mail — tudo
            no mesmo inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            A experiência seguirá o mesmo padrão do painel da plataforma: lista de
            conversas, área de mensagens e painel lateral com dados do contato.
          </p>
          <p className="mt-2">
            Spec:{" "}
            <code className="text-xs">
              .specs/006--tenant-comms-omnichannel--2026-05-22
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
