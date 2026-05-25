type MetricLabels = Record<string, string>;

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

function key(name: string, labels: MetricLabels): string {
  return `${name}:${JSON.stringify(labels)}`;
}

export const metrics = {
  increment(name: string, labels: MetricLabels = {}, value = 1): void {
    const k = key(name, labels);
    counters.set(k, (counters.get(k) ?? 0) + value);
  },

  histogram(name: string, value: number, labels: MetricLabels = {}): void {
    const k = key(name, labels);
    const arr = histograms.get(k) ?? [];
    arr.push(value);
    histograms.set(k, arr);
  },

  getCounter(name: string, labels: MetricLabels = {}): number {
    return counters.get(key(name, labels)) ?? 0;
  },

  getHistogramStats(name: string, labels: MetricLabels = {}): {
    count: number;
    avg: number;
    max: number;
  } {
    const arr = histograms.get(key(name, labels)) ?? [];
    if (arr.length === 0) return { count: 0, avg: 0, max: 0 };
    const sum = arr.reduce((a, b) => a + b, 0);
    return { count: arr.length, avg: sum / arr.length, max: Math.max(...arr) };
  },

  reset(): void {
    counters.clear();
    histograms.clear();
  },
};

export type QuotaUsage = {
  moduleId: string;
  organizationId: string;
  metric: string;
  value: number;
  limit: number;
};

const quotaAlerts: QuotaUsage[] = [];

export function recordQuotaUsage(usage: QuotaUsage): void {
  metrics.increment(usage.metric, {
    moduleId: usage.moduleId,
    organizationId: usage.organizationId,
  }, usage.value);

  if (usage.value > usage.limit) {
    quotaAlerts.push(usage);
    metrics.increment("quota.breach", {
      moduleId: usage.moduleId,
      organizationId: usage.organizationId,
    });
  }
}

export function getQuotaAlerts(): QuotaUsage[] {
  return [...quotaAlerts];
}

export function detectAbusiveModules(thresholdErrorRate = 0.05): string[] {
  const abusive: string[] = [];
  for (const [k, count] of counters) {
    if (!k.startsWith("errors:")) continue;
    const errors = count;
    const moduleId = JSON.parse(k.split(":")[1]!).moduleId as string;
    const requests = metrics.getCounter("requests", { moduleId });
    if (requests > 10 && errors / requests > thresholdErrorRate) {
      abusive.push(moduleId);
    }
  }
  return abusive;
}
