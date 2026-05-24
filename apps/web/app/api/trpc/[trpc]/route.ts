import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/routers/app";
import { createContext } from "@/server/trpc/init";
import {
  assertRateLimit,
  rateLimitKey,
  trpcPublicRateLimit,
} from "@boilerplate/shared/security";

const handler = async (req: Request) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip");
  await assertRateLimit(trpcPublicRateLimit, rateLimitKey(ip, "trpc"));

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
};

export { handler as GET, handler as POST };
