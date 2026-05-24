import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = { success: boolean; remaining: number };

interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || now >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { success: true, remaining: this.max - 1 };
    }
    entry.count += 1;
    if (entry.count > this.max) {
      return { success: false, remaining: 0 };
    }
    return { success: true, remaining: this.max - entry.count };
  }
}

function parseWindowMs(window: string): number {
  if (window === "15 m") return 15 * 60 * 1000;
  if (window === "1 h") return 60 * 60 * 1000;
  if (window === "1 m") return 60 * 1000;
  return 60 * 1000;
}

function createLimiter(prefix: string, max: number, window: string): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    const redis = new Redis({ url, token });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window as `${number} m` | `${number} h`),
      prefix: `rl:${prefix}`,
    });
    return {
      limit: async (key: string) => {
        const result = await limiter.limit(key);
        return { success: result.success, remaining: result.remaining };
      },
    };
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(`[rate-limit] Upstash não configurado; usando memória local (${prefix}).`);
  }
  return new MemoryRateLimiter(max, parseWindowMs(window));
}

export const authRateLimit = createLimiter("auth", 5, "15 m");
export const credentialRateLimit = createLimiter("credentials", 10, "1 h");
export const trpcPublicRateLimit = createLimiter("trpc-public", 60, "1 m");

export class RateLimitError extends Error {
  constructor(message = "Muitas tentativas. Aguarde e tente novamente.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function assertRateLimit(
  limiter: RateLimiter,
  key: string,
): Promise<void> {
  const { success } = await limiter.limit(key);
  if (!success) throw new RateLimitError();
}

export function rateLimitKey(ip: string | null, suffix: string): string {
  return `${ip ?? "unknown"}:${suffix}`;
}
