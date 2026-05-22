import Link from "next/link";
import { auth } from "@/auth";
import { getMembershipForUser } from "@boilerplate/db";

export async function ProvisioningBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getMembershipForUser(session.user.id);
  if (!membership) return null;

  const org = membership.organization;
  const status = org.provisioningStatus;

  if (status !== "pending_payment" && status !== "pre_active") {
    return null;
  }

  return (
    <div
      role="status"
      className="mx-6 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p className="font-medium">Validação de pagamento</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-muted-foreground">
        <span>
          {status === "pre_active"
            ? "Sua conta está em pré-ativação. Valide um método de pagamento para liberar o período de teste completo e todos os módulos do pacote."
            : "Adicione um método de pagamento para iniciar seu período de teste."}
        </span>
        <Link
          href="/configuracoes/cobranca"
          className="font-medium text-foreground underline underline-offset-4 shrink-0"
        >
          Configurar cobrança
        </Link>
      </div>
    </div>
  );
}
