import path from "node:path";

/** Opções Next.js para tracing do Prisma em monorepo (sem depender do pacote `next` em @boilerplate/db). */
export type PrismaMonorepoTracingConfig = {
  outputFileTracingRoot: string;
  outputFileTracingIncludes: Record<string, string[]>;
  serverExternalPackages: string[];
};

/**
 * Inclui o query engine do Prisma no bundle serverless (Vercel) quando o client
 * vive em packages/db/src/generated/prisma.
 */
export function prismaMonorepoTracing(
  appDirname: string,
): PrismaMonorepoTracingConfig {
  const monorepoRoot = path.join(appDirname, "../..");

  return {
    outputFileTracingRoot: monorepoRoot,
    outputFileTracingIncludes: {
      "/*": ["./packages/db/src/generated/prisma/**"],
      "/api/**/*": ["./packages/db/src/generated/prisma/**"],
    },
    serverExternalPackages: ["prisma", "@prisma/client"],
  };
}
