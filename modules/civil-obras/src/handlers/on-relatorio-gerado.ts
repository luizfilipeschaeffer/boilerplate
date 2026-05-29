import type { ModuleServerContext } from "@boilerplate/sdk-server";
import type { RelatorioGeradoPayload } from "@boilerplate/civil-obras";

/** Reservado para limpeza/notificação de download — noop no MVP. */
export async function handleRelatorioGerado(
  _ctx: ModuleServerContext,
  _organizationId: string,
  _payload: RelatorioGeradoPayload,
): Promise<void> {
  /* cleanup job handled by platform */
}
