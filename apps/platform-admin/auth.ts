import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findPlatformUserByEmail,
  verifyPlatformPassword,
  type PlatformRole,
} from "@boilerplate/db/platform-user";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;

        const platformUser = await findPlatformUserByEmail(email);
        if (!platformUser?.active) return null;

        const valid = await verifyPlatformPassword(
          password,
          platformUser.passwordHash,
        );
        if (!valid) return null;

        return {
          id: platformUser.id,
          email: platformUser.email,
          name: platformUser.name,
          platformRole: platformUser.role as PlatformRole,
        };
      },
    }),
  ],
});
