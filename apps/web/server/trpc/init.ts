import { initTRPC } from "@trpc/server";
import { z } from "zod";

export const createContext = async () => ({});

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
