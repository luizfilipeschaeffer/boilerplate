import { z } from "zod";
import { assertEnvNotDenylisted } from "./denylist";

const isProd = process.env.NODE_ENV === "production";
const isStaging = process.env.VERCEL_ENV === "preview";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_SECRET_WEB: z.string().min(32).optional(),
  AUTH_SECRET_PLATFORM_ADMIN: z.string().min(32).optional(),
  INTEGRATOR_ENCRYPTION_KEY: z.string().min(32).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Variáveis de ambiente inválidas: ${parsed.error.message}`);
  }

  if (isProd || isStaging) {
    const auth =
      parsed.data.AUTH_SECRET ??
      parsed.data.AUTH_SECRET_WEB ??
      parsed.data.AUTH_SECRET_PLATFORM_ADMIN;
    if (!auth) {
      throw new Error("AUTH_SECRET ou AUTH_SECRET_WEB/PLATFORM_ADMIN é obrigatório em produção.");
    }
    assertEnvNotDenylisted(auth, "AUTH_SECRET");

    const kek = parsed.data.INTEGRATOR_ENCRYPTION_KEY;
    if (!kek) {
      throw new Error("INTEGRATOR_ENCRYPTION_KEY é obrigatória em produção/staging.");
    }
    assertEnvNotDenylisted(kek, "INTEGRATOR_ENCRYPTION_KEY");
  }

  return parsed.data;
}
