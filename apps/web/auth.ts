import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findOrCreateUserByEmail,
  getMembershipForUser,
} from "@boilerplate/db/organization";
import {
  findUserByEmailForAuth,
  listSectorsAccessibleToUser,
  userCanAccessSector,
  verifyLoginEmailCode,
  verifyUserPassword,
} from "@boilerplate/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
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

      const userId = token.userId as string | undefined;
      if (userId) {
        const membership = await getMembershipForUser(userId);
        if (membership) {
          token.organizationId = membership.organizationId;
          token.role = membership.role;
          token.needsOnboarding = false;
          if (!token.branchId && membership.defaultBranchId) {
            token.branchId = membership.defaultBranchId;
          }
          if (!token.sectorId) {
            const firstSector =
              membership.membershipSectors[0]?.sector?.slug ?? "geral";
            token.sectorId = firstSector;
          }
        } else if (!user) {
          token.organizationId = undefined;
          token.needsOnboarding = true;
        }
      }

      if (trigger === "update" && session) {
        const s = session as { branchId?: string; sectorId?: string };
        if (s.branchId !== undefined) token.branchId = s.branchId;
        if (s.sectorId !== undefined && userId && token.organizationId) {
          const allowed = await userCanAccessSector(
            userId,
            token.organizationId as string,
            s.sectorId,
          );
          if (allowed) {
            token.sectorId = s.sectorId;
          } else {
            const sectors = await listSectorsAccessibleToUser(
              userId,
              token.organizationId as string,
            );
            if (sectors[0]) token.sectorId = sectors[0].slug;
          }
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        loginCode: { label: "Código", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        const loginCode = credentials?.loginCode?.toString() ?? "";
        if (!email) return null;

        const existing = await findUserByEmailForAuth(email);

        if (loginCode.trim()) {
          try {
            const valid = await verifyLoginEmailCode(email, loginCode);
            if (!valid || !existing) return null;
          } catch {
            return null;
          }
        } else {
          if (!existing?.passwordHash) return null;
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

        if (!membership.active) {
          return null;
        }

        const sectorSlug =
          membership.membershipSectors[0]?.sector?.slug ?? "geral";
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership.organizationId,
          sectorId: sectorSlug,
          branchId: membership.defaultBranchId ?? undefined,
          role: membership.role,
          needsOnboarding: false,
        };
      },
    }),
  ],
});
