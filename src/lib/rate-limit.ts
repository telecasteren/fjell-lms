import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { SimpleRateLimiter } from "./simple-rate-limit";
import type { Ratelimit as RatelimitType } from "@upstash/ratelimit";

// Initialize Redis client with fallback
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiting configurations for different endpoints
export const rateLimiters = {
  // Authentication endpoints - strict limits
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
        analytics: true,
        prefix: "auth",
      })
    : null,

  // Registration - balanced to prevent spam while allowing legitimate use
  registration: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(15, "1 h"), // 15 registrations per hour
        analytics: true,
        prefix: "registration",
      })
    : null,

  // Admin operations - moderate limits
  admin: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 admin operations per hour
        analytics: true,
        prefix: "admin",
      })
    : null,

  // Course operations - moderate limits
  courses: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute
        analytics: true,
        prefix: "courses",
      })
    : null,

  // Reports - strict limits (expensive operations)
  reports: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
        analytics: true,
        prefix: "reports",
      })
    : new SimpleRateLimiter(10, 60000), // Fallback: 10 requests per minute

  // General API - lenient limits
  general: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
        analytics: true,
        prefix: "general",
      })
    : null,
};

// Helper function to get client IP from request
export function getClientIP(request: Request): string {
  // Check for forwarded IP first (for reverse proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Check for real IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Default fallback
  return "unknown";
}

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const { success, limit, remaining, reset } =
      await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

// Rate limit middleware for API routes
export async function withRateLimit(
  request: Request,
  limiter: RatelimitType | SimpleRateLimiter | null,
  identifier?: string,
  fallbackLimiter?: RatelimitType | SimpleRateLimiter | null,
) {
  const ip = getClientIP(request);
  const id = identifier || ip;

  let result;

  // Check if limiter is SimpleRateLimiter
  if (limiter instanceof SimpleRateLimiter) {
    result = await limiter.checkLimit(id);
  } else if (limiter) {
    // Try Redis-based rate limiting
    result = await checkRateLimit(limiter, id);
  } else {
    // Fall back to simple in-memory rate limiting
    console.warn("Using simple rate limiting: Redis not configured");
    if (fallbackLimiter) {
      if (fallbackLimiter instanceof SimpleRateLimiter) {
        result = await fallbackLimiter.checkLimit(id);
      } else {
        // If it's a Ratelimit, use the limit method
        result = await checkRateLimit(fallbackLimiter, id);
      }
    } else {
      // No rate limiting available
      return {
        success: true,
        headers: {},
      };
    }
  }

  const { success, limit, remaining, reset } = result;

  if (!success) {
    return {
      success: false,
      error: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit,
          remaining,
          reset: new Date(reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      ),
    };
  }

  return {
    success: true,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(reset).toISOString(),
    },
  };
}
