"use client";

import * as React from "react";
import {
  confirmarPagamentoMockAction,
  iniciarValidacaoPagamento,
  loadBillingPageData,
} from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export function CobrancaValidacaoView() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<Awaited<
    ReturnType<typeof loadBillingPageData>
  > | null>(null);
  const [integratorId, setIntegratorId] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    void loadBillingPageData()
      .then((d) => {
        setData(d);
        setIntegratorId(
          d.currentIntegratorId ?? d.gateways.find((g) => g.isDefault)?.id ?? d.gateways[0]?.id ?? "",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function iniciar() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await iniciarValidacaoPagamento(integratorId || undefined);
      if (res.status === "verified") {
        setMessage("Pagamento validado! Seu período de teste foi liberado.");
        const refreshed = await loadBillingPageData();
        setData(refreshed);
      } else {
        setMessage(
          "Validação iniciada. No ambiente de desenvolvimento, use o botão abaixo para simular a confirmação.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao validar");
    } finally {
      setBusy(false);
    }
  }

  async function simularMock() {
    setBusy(true);
    try {
      await confirmarPagamentoMockAction();
      setMessage("Pagamento confirmado (mock). Trial liberado!");
      const refreshed = await loadBillingPageData();
      setData(refreshed);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar.</p>;
  }

  if (data.paymentVerified && data.provisioningStatus === "trial") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cobrança</CardTitle>
          <CardDescription>
            Método de pagamento verificado.
            {data.trialEndsAt
              ? ` Trial até ${new Date(data.trialEndsAt).toLocaleDateString("pt-BR")}.`
              : null}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar método de pagamento</CardTitle>
        <CardDescription>
          Para liberar o período de teste completo e os módulos do seu pacote,
          adicione e valide um método de pagamento. Você pode usar o painel em
          modo pré-ativação até concluir esta etapa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 max-w-md">
        <div className="space-y-2">
          <Label>Gateway</Label>
          <Select
            value={integratorId}
            onValueChange={(value) => setIntegratorId(value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {data.gateways.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={busy} onClick={() => void iniciar()}>
          {busy ? <Spinner className="size-4" /> : "Iniciar validação"}
        </Button>
        {integratorId === "payment-mock" ? (
          <Button variant="secondary" disabled={busy} onClick={() => void simularMock()}>
            Simular confirmação (mock)
          </Button>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
