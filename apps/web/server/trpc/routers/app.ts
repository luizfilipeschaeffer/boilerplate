import { getAllModules } from "@boilerplate/module-registry";
import { z } from "zod";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { publicProcedure, router } from "../init";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "boilerplate-web" })),

  modulosAtivos: publicProcedure.query(async () => {
    return getActiveModuleIds();
  }),

  modulosRegistry: publicProcedure.query(() => {
    ensureModulesRegistered();
    return getAllModules().map((m) => ({
      id: m.id,
      name: m.name,
      status: m.implementationStatus,
      parent: m.parentModuleId,
    }));
  }),

  classificarFase: publicProcedure
    .input(
      z.object({
        temPontoFixo: z.boolean(),
        vendasMes: z.enum(["ate50", "50a200", "200a1000", "acima1000"]),
        temFuncionarios: z.boolean(),
        emiteNota: z.boolean().nullable(),
      }),
    )
    .mutation(({ input }) => {
      let score = 0;
      if (input.temPontoFixo) score += 1;
      if (input.vendasMes === "50a200") score += 1;
      if (input.vendasMes === "200a1000") score += 2;
      if (input.vendasMes === "acima1000") score += 3;
      if (input.temFuncionarios) score += 1;
      if (input.emiteNota) score += 2;
      if (score <= 1) return { fase: 1 as const };
      if (score <= 3) return { fase: 2 as const };
      if (score <= 5) return { fase: 3 as const };
      return { fase: 4 as const };
    }),
});

export type AppRouter = typeof appRouter;
