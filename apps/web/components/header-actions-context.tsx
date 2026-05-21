"use client";

import * as React from "react";

type HeaderActionsContextValue = {
  actions: React.ReactNode;
  setActions: (node: React.ReactNode) => void;
};

const HeaderActionsContext = React.createContext<HeaderActionsContextValue | null>(
  null,
);

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = React.useState<React.ReactNode>(null);
  const value = React.useMemo(
    () => ({ actions, setActions }),
    [actions],
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
