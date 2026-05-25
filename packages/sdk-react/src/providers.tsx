"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OrgContext, Permission } from "@boilerplate/sdk-core";

const OrgContextReact = createContext<OrgContext | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContext;
  children: ReactNode;
}) {
  return <OrgContextReact.Provider value={value}>{children}</OrgContextReact.Provider>;
}

export function useOrg(): OrgContext {
  const ctx = useContext(OrgContextReact);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}

export function usePermission(
  permission: Permission,
  scope?: Partial<Pick<OrgContext, "branchId" | "departmentId" | "teamId">>,
): boolean {
  const org = useOrg();
  return org.can(permission, {
    organizationId: org.organizationId,
    ...scope,
  });
}

export type ModuleRuntimeInfo = {
  moduleId: string;
  version: string;
  active: boolean;
};

const ModuleContext = createContext<ModuleRuntimeInfo | null>(null);

export function ModuleProvider({
  value,
  children,
}: {
  value: ModuleRuntimeInfo;
  children: ReactNode;
}) {
  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModule(moduleId: string): ModuleRuntimeInfo {
  const ctx = useContext(ModuleContext);
  if (!ctx || ctx.moduleId !== moduleId) {
    return { moduleId, version: "0.0.0", active: false };
  }
  return ctx;
}

export function useEvent(_type: string, _handler: (payload: unknown) => void): void {
  // Client-side event subscription via SSE/WebSocket — wired in app layer
}

export const trpc = {
  query: async (_path: string) => {
    throw new Error("Configure trpc client in app bootstrap");
  },
  mutate: async (_path: string, _input: unknown) => {
    throw new Error("Configure trpc client in app bootstrap");
  },
};
