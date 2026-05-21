import type { NextAuthConfig } from "next-auth";
import type { PlatformRole } from "@/lib/platform-role";

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
        const u = user as { id: string; platformRole: PlatformRole };
        token.userId = u.id;
        token.platformRole = u.platformRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.platformRole = token.platformRole as PlatformRole;
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
