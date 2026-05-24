export type ContractVersion = `${number}.${number}.${number}`;

export interface SupportsContract {
  module: string;
  events: string;
  sdk: string;
}

export const CORE_CONTRACT_VERSION = "1.2.0" as const;
export const EVENTS_CONTRACT_VERSION = "2.0.0" as const;
export const SDK_CONTRACT_VERSION = "3.0.0" as const;

export function satisfiesSemverRange(
  version: string,
  range: string,
): boolean {
  const v = parseSemver(version);
  const r = parseRange(range);
  if (!v || !r) return false;
  if (r.major !== null && v.major !== r.major) return false;
  if (r.minor !== null && v.minor < r.minor) return false;
  if (r.patch !== null && v.patch < r.patch) return false;
  return true;
}

function parseSemver(v: string): { major: number; minor: number; patch: number } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) return null;
  return { major: +m[1]!, minor: +m[2]!, patch: +m[3]! };
}

function parseRange(range: string): {
  major: number | null;
  minor: number | null;
  patch: number | null;
} | null {
  const caret = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  if (caret) {
    return {
      major: +caret[1]!,
      minor: +caret[2]!,
      patch: null,
    };
  }
  const exact = /^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  if (exact) {
    return { major: +exact[1]!, minor: +exact[2]!, patch: +exact[3]! };
  }
  return null;
}
