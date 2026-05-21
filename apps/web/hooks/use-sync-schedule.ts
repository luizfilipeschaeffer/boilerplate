"use client";

import * as React from "react";
import {
  getSyncSchedule,
  subscribeSyncSchedule,
} from "@/lib/idb/sync-service";

function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function useSyncSchedule() {
  const [schedule, setSchedule] = React.useState(getSyncSchedule);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => subscribeSyncSchedule(() => setSchedule(getSyncSchedule())), []);

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs =
    schedule.nextAt != null ? Math.max(0, schedule.nextAt - now) : null;

  return {
    ...schedule,
    remainingMs,
    countdown:
      remainingMs != null ? formatCountdown(remainingMs) : null,
  };
}
