import { auth } from "@/auth";
import { initTRPC, TRPCError } from "@trpc/server";

export const createContext = async () => {
  const session = await auth();
  return { session };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.needsOnboarding || !ctx.session.organizationId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "ONBOARDING_REQUIRED",
    });
  }
  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.session.organizationId,
      sectorId: ctx.session.sectorId ?? "geral",
    },
  });
});
