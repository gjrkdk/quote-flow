// NOTE: In-memory rate limiting. Only works for single-instance deployments. For multi-instance, migrate to Redis.

import { json } from "@remix-run/node";

/**
 * Rate limit configuration
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // per store per window

/**
 * Rate limit entry structure
 */
interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

/**
 * In-memory store: Map<storeId, RateLimitEntry>
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Custom error class for rate limit exceeded
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Checks if a request is within rate limits for the given store.
 * Throws 429 JSON response if rate limit is exceeded.
 *
 * @param storeId - The store ID to check rate limits for
 * @throws 429 JSON response with Retry-After header if limit exceeded
 */
export function checkRateLimit(storeId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(storeId);

  // No entry or expired entry - create new window
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(storeId, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  // Entry exists and not expired - increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    throw json(
      {
        type: "about:blank",
        title: "Too Many Requests",
        status: 429,
        detail: "Rate limit exceeded. Try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
      }
    );
  }
}

/**
 * Returns standard rate limit headers for a given store.
 *
 * @param storeId - The store ID to get rate limit info for
 * @returns Headers object with X-RateLimit-* headers
 */
export function getRateLimitHeaders(storeId: string): Record<string, string> {
  const entry = rateLimitStore.get(storeId);
  const now = Date.now();

  // No entry or expired - return full limit
  if (!entry || now > entry.resetAt) {
    return {
      "X-RateLimit-Limit": MAX_REQUESTS.toString(),
      "X-RateLimit-Remaining": MAX_REQUESTS.toString(),
      "X-RateLimit-Reset": Math.floor((now + WINDOW_MS) / 1000).toString(),
    };
  }

  // Active window - calculate remaining
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);

  return {
    "X-RateLimit-Limit": MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.floor(entry.resetAt / 1000).toString(),
  };
}

/**
 * Cleanup expired entries periodically to prevent memory leaks.
 * Runs every 5 minutes and removes entries older than their reset time.
 */
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [storeId, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(storeId);
      }
    }
  },
  5 * 60 * 1000 // 5 minutes
);

// Prevent cleanup interval from keeping the process alive
cleanupInterval.unref();
