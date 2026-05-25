import path from "node:path";

/** Opções Next.js para tracing do Prisma em monorepo (sem depender do pacote `next` em @boilerplate/db). */
export type PrismaMonorepoTracingConfig = {
  outputFileTracingRoot: string;
  outputFileTracingIncludes: Record<string, string[]>;
};

const PRISMA_TRACE_GLOBS = [
  "./packages/db/src/generated/prisma/**",
  "./src/generated/prisma/**",
] as const;

/**
 * Inclui o query engine do Prisma no bundle serverless (Vercel / Next.js 16 Turbopack).
 * Requer `bun scripts/sync-prisma-engine-to-apps.ts` no build (ver generate-client / vercel-build).
 */
export function prismaMonorepoTracing(appDirname: string): PrismaMonorepoTracingConfig {
  const monorepoRoot = path.join(appDirname, "../..");

  return {
    outputFileTracingRoot: monorepoRoot,
    outputFileTracingIncludes: {
      "/*": [...PRISMA_TRACE_GLOBS],
      "/api/**/*": [...PRISMA_TRACE_GLOBS],
      "/**": [...PRISMA_TRACE_GLOBS],
    },
  };
}
