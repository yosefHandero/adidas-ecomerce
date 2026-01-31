import type { NextRequest } from 'next/server';
import { logger } from '../logger/logger';

/**
 * Rate limit entry in memory store
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * In-memory rate limit store
 * ⚠️ WARNING: This is not production-ready for multi-instance deployments.
 * For production, use Redis or a distributed cache.
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }, 5 * 60 * 1000);
}

/**
 * Rate limit by identifier (IP address or user ID)
 * @param identifier - IP address or user ID
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute default
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window or expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    logger.warn('Rate limit exceeded', {
      identifier,
      maxRequests,
      windowMs,
      retryAfter,
    });
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from NextRequest
 * Handles various proxy headers (x-forwarded-for, x-real-ip, etc.)
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }

  // Fallback (won't work in serverless, but helps in dev)
  return 'unknown';
}
