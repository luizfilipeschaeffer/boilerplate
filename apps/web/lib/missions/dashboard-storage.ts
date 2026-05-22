const PROGRESS_KEY = "dashboard-missions-progress";
const CELEBRATE_KEY = "dashboard-missions-celebrate";

export function readMissionProgress(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(PROGRESS_KEY);
  const n = parseInt(raw ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function writeMissionProgress(doneCount: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROGRESS_KEY, String(doneCount));
}

export function markMissionCelebratePending() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CELEBRATE_KEY, "1");
}

export function consumeMissionCelebratePending(): boolean {
  if (typeof window === "undefined") return false;
  const pending = sessionStorage.getItem(CELEBRATE_KEY) === "1";
  if (pending) sessionStorage.removeItem(CELEBRATE_KEY);
  return pending;
}

export function shouldCelebrateMissionComplete(
  doneCount: number,
  total: number,
  allDone: boolean,
): boolean {
  if (!allDone) return false;
  if (consumeMissionCelebratePending()) return true;
  const prev = readMissionProgress();
  return prev > 0 && prev < total;
}
