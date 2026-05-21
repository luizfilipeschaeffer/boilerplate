import { getAllModules } from "@boilerplate/module-registry";
import { z } from "zod";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { publicProcedure, router } from "../init";
import { onboardingRouter } from "./onboarding";
import { catalogRouter } from "./catalog";

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

  onboarding: onboardingRouter,
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
