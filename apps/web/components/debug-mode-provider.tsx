"use client";

import * as React from "react";

const STORAGE_KEY = "boilerplate-debug-bar";

type DebugModeContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
};

const DebugModeContext = React.createContext<DebugModeContextValue | null>(null);

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(enabled: boolean) {
  try {
    if (enabled) sessionStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function DebugModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = React.useState(() => readStored());

  const setEnabled = React.useCallback((value: boolean) => {
    setEnabledState(value);
    writeStored(value);
  }, []);

  const toggle = React.useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev;
      writeStored(next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey) return;
      if (event.key.toLowerCase() !== "u") return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = React.useMemo(
    () => ({ enabled, toggle, setEnabled }),
    [enabled, toggle, setEnabled],
  );

  return (
    <DebugModeContext.Provider value={value}>{children}</DebugModeContext.Provider>
  );
}

export function useDebugMode() {
  const ctx = React.useContext(DebugModeContext);
  if (!ctx) {
    throw new Error("useDebugMode deve ser usado dentro de DebugModeProvider");
  }
  return ctx;
}
