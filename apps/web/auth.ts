import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email) return null;
        return {
          id: "dev-user",
          email: String(credentials.email),
          name: "Usuário Dev",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.organizationId = "dev-org";
        token.sectorId = "geral";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session as { organizationId?: string }).organizationId =
          token.organizationId as string;
        (session as { sectorId?: string }).sectorId = token.sectorId as string;
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
