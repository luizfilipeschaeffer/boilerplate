"use client";

import * as React from "react";

type HeaderActionsContextValue = {
  actions: React.ReactNode;
  setActions: (node: React.ReactNode) => void;
  info: React.ReactNode;
  setInfo: (node: React.ReactNode) => void;
};

export const HeaderActionsContext =
  React.createContext<HeaderActionsContextValue | null>(null);

export function HeaderActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [actions, setActions] = React.useState<React.ReactNode>(null);
  const [info, setInfo] = React.useState<React.ReactNode>(null);
  const value = React.useMemo(
    () => ({ actions, setActions, info, setInfo }),
    [actions, info],
  );
  return (
    <HeaderActionsContext.Provider value={value}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function HeaderActionsSlot() {
  const ctx = React.useContext(HeaderActionsContext);
  if (!ctx?.actions) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">{ctx.actions}</div>
  );
}

/** Define botões/ações exibidos no cabeçalho da página atual. */
export function SetHeaderActions({ children }: { children: React.ReactNode }) {
  const setActions = React.useContext(HeaderActionsContext)?.setActions;
  React.useEffect(() => {
    if (!setActions) return;
    setActions(children);
    return () => setActions(null);
  }, [children, setActions]);
  return null;
}

/** Texto exibido no ícone de informações ao lado do título do cabeçalho. */
export function SetHeaderInfo({ children }: { children: React.ReactNode }) {
  const setInfo = React.useContext(HeaderActionsContext)?.setInfo;
  React.useEffect(() => {
    if (!setInfo) return;
    setInfo(children);
    return () => setInfo(null);
  }, [children, setInfo]);
  return null;
}
