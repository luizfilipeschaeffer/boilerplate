import type { NextAuthConfig } from "next-auth";

/**
 * Base NextAuth para o middleware (Edge, sem Prisma).
 * Membership no JWT é sincronizada em `auth.ts` (Node).
 */
export const authConfig = {
  trustHost: true,
  cookies: {
    sessionToken: {
      name: "boilerplate-web.session-token",
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id: string;
          organizationId?: string | null;
          sectorId?: string | null;
          branchId?: string | null;
          role?: string | null;
          needsOnboarding?: boolean;
        };
        token.userId = u.id;
        token.organizationId = u.organizationId ?? undefined;
        token.sectorId = u.sectorId ?? undefined;
        token.branchId = u.branchId ?? undefined;
        token.role = u.role ?? undefined;
        token.needsOnboarding = u.needsOnboarding ?? false;
      }
      if (trigger === "update" && session) {
        const s = session as {
          branchId?: string;
          sectorId?: string;
        };
        if (s.branchId !== undefined) token.branchId = s.branchId;
        if (s.sectorId !== undefined) token.sectorId = s.sectorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.organizationId = token.organizationId as string | undefined;
        session.sectorId = (token.sectorId as string) ?? "geral";
        session.branchId = token.branchId as string | undefined;
        session.role = (token.role as string) ?? "dono";
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
