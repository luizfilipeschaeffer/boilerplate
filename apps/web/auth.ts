import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findOrCreateUserByEmail,
  getMembershipForUser,
} from "@boilerplate/db/organization";
import {
  findUserByEmailForAuth,
  verifyUserPassword,
} from "@boilerplate/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email) return null;

        const existing = await findUserByEmailForAuth(email);
        if (existing?.passwordHash) {
          const valid = await verifyUserPassword(
            password,
            existing.passwordHash,
          );
          if (!valid) return null;
        }

        const user = existing ?? (await findOrCreateUserByEmail(email));
        const membership = await getMembershipForUser(user.id);

        if (!membership) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            needsOnboarding: true,
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership.organizationId,
          sectorId: "geral",
          needsOnboarding: false,
        };
      },
    }),
  ],
});
