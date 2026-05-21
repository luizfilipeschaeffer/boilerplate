import {
  isAprendizEnabled,
  listLowStockItems,
  persistDomainEvent,
} from "@boilerplate/db";
import { onDomainEvent } from "@boilerplate/shared";

let registered = false;

export function registerDomainEventHandlers(): void {
  if (registered) return;
  registered = true;

  onDomainEvent("venda.confirmada", async (event) => {
    const alertaAtivo = await isAprendizEnabled(
      event.schemaName,
      "estoque-baixo",
    );
    if (!alertaAtivo) return;

    const low = await listLowStockItems(event.schemaName);
    for (const item of low) {
      await persistDomainEvent({
        organizationId: event.organizationId,
        eventType: "estoque.baixo",
        payload: {
          catalogItemId: item.id,
          name: item.name,
          stockQty: item.stock_qty,
          stockMin: item.stock_min,
        },
      });
    }
  });

  onDomainEvent("item.criado", async () => {
    /* reservado para integrações futuras */
  });
}
