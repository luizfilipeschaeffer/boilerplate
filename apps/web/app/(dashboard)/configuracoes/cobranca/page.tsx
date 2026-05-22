import { CobrancaValidacaoView } from "@/components/cobranca-validacao-view";

export default function ConfigCobrancaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          Validação de pagamento e período de teste da sua conta.
        </p>
      </div>
      <CobrancaValidacaoView />
    </div>
  );
}
