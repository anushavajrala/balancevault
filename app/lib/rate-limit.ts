import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export class RateLimitUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitUnavailableError";
  }
}

type RateLimitDecision = {
  success: boolean;
  reset: number;
};

let limiter: Ratelimit | undefined;

function getLimiter(): Ratelimit {
  if (limiter) return limiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new RateLimitUnavailableError("Rate limiting is not configured");
  }

  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "balancevault:rate-limit",
  });
  return limiter;
}

function getClientIp(request: Request): string {
  const directIp = request.headers.get("x-real-ip")?.trim();
  if (directIp) return directIp;

  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedIp) return forwardedIp;

  throw new RateLimitUnavailableError("Client IP address is unavailable");
}

export async function checkRateLimit(request: Request, namespace: string): Promise<RateLimitDecision> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true, reset: Date.now() };
  }

  const clientIp = getClientIp(request);
  try {
    return await getLimiter().limit(`${namespace}:${clientIp}`);
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) throw error;
    console.error("UPSTASH RATE LIMIT ERROR:", error);
    throw new RateLimitUnavailableError("Rate limiting service is unavailable");
  }
}

export function rateLimitRetryAfter(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}
