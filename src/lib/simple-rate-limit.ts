// Simple in-memory rate limiter fallback
// This is used when Redis is not available

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class SimpleRateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async checkLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / this.windowMs)}`;

    const entry = this.limits.get(key);

    if (!entry || entry.resetTime <= now) {
      // New window or expired entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime <= now) {
        this.limits.delete(key);
      }
    }
  }
}

// Create simple rate limiters
export const simpleRateLimiters = {
  auth: new SimpleRateLimiter(5, 60 * 1000), // 5 requests per minute
  registration: new SimpleRateLimiter(3, 60 * 60 * 1000), // 3 requests per hour
  admin: new SimpleRateLimiter(10, 60 * 60 * 1000), // 10 requests per hour
  courses: new SimpleRateLimiter(20, 60 * 1000), // 20 requests per minute
  reports: new SimpleRateLimiter(5, 60 * 1000), // 5 requests per minute
  general: new SimpleRateLimiter(100, 60 * 1000), // 100 requests per minute
};

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    Object.values(simpleRateLimiters).forEach((limiter) => limiter.cleanup());
  },
  5 * 60 * 1000,
);
