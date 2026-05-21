"use client";

import * as React from "react";
import { signOut } from "next-auth/react";

import { INACTIVITY_LOGOUT_MS } from "@/lib/inactivity-logout";
import { stopTenantSyncLoop } from "@/lib/idb/sync-service";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "click",
  "scroll",
  "touchstart",
] as const;

const RESET_THROTTLE_MS = 1_000;

/**
 * Encerra a sessão após inatividade no painel e interrompe o loop de sync em background.
 */
export function InactivityLogoutGuard() {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = React.useRef(0);

  const scheduleLogout = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopTenantSyncLoop();
      void signOut({ callbackUrl: "/login?reason=inactivity" });
    }, INACTIVITY_LOGOUT_MS);
  }, []);

  const onActivity = React.useCallback(() => {
    const now = Date.now();
    if (now - lastResetRef.current < RESET_THROTTLE_MS) return;
    lastResetRef.current = now;
    scheduleLogout();
  }, [scheduleLogout]);

  React.useEffect(() => {
    scheduleLogout();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [onActivity, scheduleLogout]);

  return null;
}
