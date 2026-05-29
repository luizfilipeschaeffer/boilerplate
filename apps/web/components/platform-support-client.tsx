"use client";

import type { SupportTicket } from "@boilerplate/platform-api";
import { useState, useTransition } from "react";
import { createSupportTicketAction } from "@/app/actions/platform-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialTickets: SupportTicket[];
};

export function PlatformSupportClient({ initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Abrir ticket</CardTitle>
          <CardDescription>
            Suporte vinculado à sua instalação (contexto técnico sanitizado).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            placeholder="Descreva o problema"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button
            disabled={pending || !subject || !body}
            onClick={() =>
              startTransition(async () => {
                const t = await createSupportTicketAction({
                  subject,
                  body,
                  type: "question",
                });
                setTickets((prev) => [t, ...prev]);
                setSubject("");
                setBody("");
              })
            }
          >
            Enviar
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.subject}</span>
                <Badge variant="outline">{t.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
