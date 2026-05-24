import { auth } from "@/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import { assertActiveMembership } from "@boilerplate/db";

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

export const membershipProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const membership = await assertActiveMembership(ctx.userId);
  return next({
    ctx: {
      ...ctx,
      membership,
      organizationId: membership.organizationId,
      schemaName: membership.schemaName,
      role: membership.role,
    },
  });
});

export const tenantProcedure = membershipProcedure.use(({ ctx, next }) => {
  if (ctx.session.needsOnboarding) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "ONBOARDING_REQUIRED",
    });
  }
  return next({
    ctx: {
      ...ctx,
      sectorId: ctx.session.sectorId ?? "geral",
    },
  });
});
