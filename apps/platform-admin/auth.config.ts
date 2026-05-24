import type { NextAuthConfig } from "next-auth";
import type { PlatformRole } from "@/lib/platform-role";
import {
  buildSessionConfig,
  buildSessionCookieOptions,
  resolveAuthSecret,
  resolveTrustHost,
} from "@boilerplate/shared/security";

/**
 * Config compartilhada sem Prisma. O middleware importa só este arquivo.
 */
export const authConfig = {
  trustHost: resolveTrustHost(),
  cookies: buildSessionCookieOptions("boilerplate-platform-admin.session-token"),
  pages: {
    signIn: "/login",
  },
  session: buildSessionConfig(),
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; platformRole: PlatformRole };
        token.userId = u.id;
        token.platformRole = u.platformRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.platformRole = token.platformRole as PlatformRole | undefined;
      }
      return session;
    },
  },
  secret: resolveAuthSecret("AUTH_SECRET_PLATFORM_ADMIN"),
} satisfies NextAuthConfig;
