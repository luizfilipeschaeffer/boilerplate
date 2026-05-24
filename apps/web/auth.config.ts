import type { NextAuthConfig } from "next-auth";
import {
  buildSessionConfig,
  buildSessionCookieOptions,
  resolveAuthSecret,
  resolveTrustHost,
} from "@boilerplate/shared/security";

/**
 * Base NextAuth para o middleware (Edge, sem Prisma).
 * Membership no JWT é sincronizada em `auth.ts` (Node).
 */
export const authConfig = {
  trustHost: resolveTrustHost(),
  cookies: buildSessionCookieOptions("boilerplate-web.session-token"),
  pages: {
    signIn: "/login",
  },
  session: buildSessionConfig(),
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
          sessionVersion?: number;
        };
        token.userId = u.id;
        token.organizationId = u.organizationId ?? undefined;
        token.sectorId = u.sectorId ?? undefined;
        token.branchId = u.branchId ?? undefined;
        token.role = u.role ?? undefined;
        token.needsOnboarding = u.needsOnboarding ?? false;
        token.sessionVersion = u.sessionVersion ?? 0;
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
        session.role = token.role as string | undefined;
        session.needsOnboarding = Boolean(token.needsOnboarding);
        session.sessionVersion = (token.sessionVersion as number) ?? 0;
      }
      return session;
    },
  },
  secret: resolveAuthSecret("AUTH_SECRET_WEB"),
} satisfies NextAuthConfig;
