import type { ModuleServerContext } from "@boilerplate/sdk-server";
import type { CreateObraInput, ObraSummary } from "@boilerplate/civil-obras";

/** Serviço de obras — persistência via host (`packages/db`). */
export function createObrasService(ctx: ModuleServerContext) {
  void ctx;
  return {
    async list(_tenantId: string, _filters?: unknown): Promise<ObraSummary[]> {
      return [];
    },
    async create(
      _tenantId: string,
      _fiscalId: string | null,
      _input: CreateObraInput,
    ): Promise<ObraSummary> {
      throw new Error("Use server actions / @boilerplate/db repository");
    },
  };
}
