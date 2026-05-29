import { resolveAuthMode } from "@boilerplate/platform-api";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findOrCreateUserByEmail,
  getMembershipForUser,
} from "@boilerplate/db/organization";
import {
  findUserByEmailForAuth,
  listSectorsAccessibleToUser,
  prisma,
  userCanAccessBranch,
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

      const userId = token.userId as string | undefined;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { sessionVersion: true },
        });
        if (!dbUser) {
          return {};
        }
        const tokenVersion = (token.sessionVersion as number | undefined) ?? 0;
        if (tokenVersion !== dbUser.sessionVersion) {
          return {};
        }
        token.sessionVersion = dbUser.sessionVersion;

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
        if (s.branchId !== undefined && userId && token.organizationId) {
          const branchAllowed = await userCanAccessBranch(
            userId,
            token.organizationId as string,
            s.branchId,
          );
          if (branchAllowed) {
            token.branchId = s.branchId;
          }
        }
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
    ...(resolveAuthMode() === "central"
      ? [
          Credentials({
            id: "central",
            name: "Conta Boilerplate",
            credentials: {
              email: { label: "E-mail", type: "email" },
              password: { label: "Senha", type: "password" },
            },
            authorize: async (credentials) => {
              const email = credentials?.email?.toString().trim().toLowerCase();
              const password = credentials?.password?.toString() ?? "";
              if (!email || !password) return null;
              const central =
                process.env.CENTRAL_API_URL ??
                process.env.NEXT_PUBLIC_CENTRAL_API_URL ??
                "http://localhost:3002";
              const res = await fetch(`${central.replace(/\/$/, "")}/api/oauth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                redirect: "manual",
                body: JSON.stringify({
                  grant_type: "password",
                  username: email,
                  password,
                }),
              });
              if (res.status >= 300 && res.status < 400) return null;
              if (!res.ok) return null;
              const user = await findUserByEmailForAuth(email);
              if (!user) return null;
              const membership = await getMembershipForUser(user.id);
              if (!membership?.active) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  needsOnboarding: true,
                  sessionVersion: 0,
                };
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
                sessionVersion: 0,
              };
            },
          }),
        ]
      : []),
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
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        const membership = await getMembershipForUser(user.id);

        if (!membership) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            needsOnboarding: true,
            sessionVersion: dbUser?.sessionVersion ?? 0,
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
          sessionVersion: dbUser?.sessionVersion ?? 0,
        };
      },
    }),
  ],
});
