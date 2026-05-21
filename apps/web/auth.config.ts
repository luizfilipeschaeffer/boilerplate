import type { NextAuthConfig } from "next-auth";

/**
 * Config compartilhada sem Prisma. O middleware importa só este arquivo.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          organizationId?: string | null;
          sectorId?: string | null;
          needsOnboarding?: boolean;
        };
        token.userId = u.id;
        token.organizationId = u.organizationId ?? undefined;
        token.sectorId = u.sectorId ?? undefined;
        token.needsOnboarding = u.needsOnboarding ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.organizationId = token.organizationId as string | undefined;
        session.sectorId = (token.sectorId as string) ?? "geral";
        session.needsOnboarding = Boolean(token.needsOnboarding);
      }
      return session;
    },
  },
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-only-auth-secret-change-in-env"
      : undefined),
} satisfies NextAuthConfig;
