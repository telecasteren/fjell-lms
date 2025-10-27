import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, getClientIP, withRateLimit } from '@/lib/rate-limit'
import { simpleRateLimiters } from '@/lib/simple-rate-limit'

// Mock the simple rate limiter
vi.mock('@/lib/simple-rate-limit', () => ({
  simpleRateLimiters: {
    auth: {
      checkLimit: vi.fn(),
    },
    general: {
      checkLimit: vi.fn(),
    },
  },
}))

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getClientIP', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('extracts IP from x-real-ip header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('extracts IP from cf-connecting-ip header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': '192.168.1.1',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('returns unknown when no IP headers present', () => {
      const request = new Request('http://localhost:3000/api/test')

      const ip = getClientIP(request)
      expect(ip).toBe('unknown')
    })
  })

  describe('withRateLimit', () => {
    it('allows request when rate limit not exceeded', async () => {
      const mockCheckLimit = vi.mocked(simpleRateLimiters.auth.checkLimit)
      mockCheckLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      })

      const request = new Request('http://localhost:3000/api/test')
      const result = await withRateLimit(request, null, undefined, simpleRateLimiters.auth)

      expect(result.success).toBe(true)
      expect(result.headers).toEqual({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': expect.any(String),
      })
    })

    it('blocks request when rate limit exceeded', async () => {
      const mockCheckLimit = vi.mocked(simpleRateLimiters.auth.checkLimit)
      mockCheckLimit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      const request = new Request('http://localhost:3000/api/test')
      const result = await withRateLimit(request, null, undefined, simpleRateLimiters.auth)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Response)
      expect(result.error?.status).toBe(429)
    })

    it('handles missing fallback limiter gracefully', async () => {
      const request = new Request('http://localhost:3000/api/test')
      const result = await withRateLimit(request, null, undefined, null)

      expect(result.success).toBe(true)
      expect(result.headers).toEqual({})
    })

    it('includes rate limit headers in successful response', async () => {
      const mockCheckLimit = vi.mocked(simpleRateLimiters.general.checkLimit)
      mockCheckLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      })

      const request = new Request('http://localhost:3000/api/test')
      const result = await withRateLimit(request, null, undefined, simpleRateLimiters.general)

      expect(result.success).toBe(true)
      expect(result.headers).toHaveProperty('X-RateLimit-Limit')
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining')
      expect(result.headers).toHaveProperty('X-RateLimit-Reset')
    })
  })

  describe('checkRateLimit', () => {
    it('handles rate limiter errors gracefully', async () => {
      const mockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Rate limiter error')),
      }

      const result = await checkRateLimit(mockLimiter as any, 'test-id')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.reset).toBe(0)
    })

    it('returns rate limit result when successful', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        }),
      }

      const result = await checkRateLimit(mockLimiter as any, 'test-id')

      expect(result.success).toBe(true)
      expect(result.limit).toBe(10)
      expect(result.remaining).toBe(9)
      expect(result.reset).toBeGreaterThan(Date.now())
    })
  })
})
