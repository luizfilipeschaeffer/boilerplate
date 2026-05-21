import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findOrCreateUserByEmail,
  getMembershipForUser,
  organizationHasOnboarding,
} from "@boilerplate/db/organization";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim();
        if (!email) return null;

        const user = await findOrCreateUserByEmail(email);
        const membership = await getMembershipForUser(user.id);

        if (!membership) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            needsOnboarding: true,
          };
        }

        const hasOnboarding = await organizationHasOnboarding(
          membership.organizationId,
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership.organizationId,
          sectorId: "geral",
          needsOnboarding: !hasOnboarding,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
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

      if (token.userId && !user) {
        const membership = await getMembershipForUser(token.userId as string);
        if (!membership) {
          token.organizationId = undefined;
          token.needsOnboarding = true;
        } else {
          const hasOnboarding = await organizationHasOnboarding(
            membership.organizationId,
          );
          token.organizationId = membership.organizationId;
          token.sectorId = "geral";
          token.needsOnboarding = !hasOnboarding;
        }
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
});
