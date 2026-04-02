/**
 * Rate Limiting Service
 * Client-side rate limiting with server-side compatible structure.
 * When migrating to Supabase Edge Functions, this logic transfers directly.
 */

// ==================== TYPES ====================

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit?: number;
}

export interface RateLimitState {
  requests: number[]; // Timestamps of requests
  blockedUntil: number | null;
  violationCount: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ==================== DEFAULT CONFIGS ====================

export const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  // API endpoints
  'api/default': { requestsPerMinute: 60, requestsPerHour: 1000, burstLimit: 10 },
  'api/auth': { requestsPerMinute: 5, requestsPerHour: 30, burstLimit: 3 },
  'api/upload': { requestsPerMinute: 10, requestsPerHour: 100, burstLimit: 5 },
  'api/export': { requestsPerMinute: 5, requestsPerHour: 50, burstLimit: 2 },

  // Feature-specific limits
  'feature/search': { requestsPerMinute: 30, requestsPerHour: 500, burstLimit: 5 },
  'feature/notification': { requestsPerMinute: 20, requestsPerHour: 300, burstLimit: 5 },
  'feature/message': { requestsPerMinute: 60, requestsPerHour: 1000, burstLimit: 10 },

  // Strict limits for sensitive operations
  'strict/pin': { requestsPerMinute: 3, requestsPerHour: 10, burstLimit: 2 },
  'strict/delete': { requestsPerMinute: 5, requestsPerHour: 50, burstLimit: 2 },
};

// ==================== STORAGE ====================

const STORAGE_KEY = 'rate_limit_state';

class RateLimitStorage {
  private memoryStore = new Map<string, RateLimitState>();

  get(key: string): RateLimitState | null {
    // Try memory first
    const mem = this.memoryStore.get(key);
    if (mem) return mem;

    // Try localStorage for persistence across reloads
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryStore.set(key, parsed);
        return parsed;
      }
    } catch {
      // localStorage not available
    }

    return null;
  }

  set(key: string, state: RateLimitState): void {
    this.memoryStore.set(key, state);

    try {
      localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(state));
    } catch {
      // localStorage not available
    }
  }

  clear(key?: string): void {
    if (key) {
      this.memoryStore.delete(key);
      try {
        localStorage.removeItem(`${STORAGE_KEY}_${key}`);
      } catch {}
    } else {
      this.memoryStore.clear();
      // Clear all rate limit keys
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k?.startsWith(STORAGE_KEY)) {
            localStorage.removeItem(k);
          }
        }
      } catch {}
    }
  }
}

const storage = new RateLimitStorage();

// ==================== CORE RATE LIMITER ====================

export class RateLimiter {
  private config: RateLimitConfig;
  private key: string;

  constructor(key: string, config?: RateLimitConfig) {
    this.key = key;
    this.config = config || DEFAULT_LIMITS[key] || DEFAULT_LIMITS['api/default'];
  }

  /**
   * Check if a request is allowed
   */
  checkLimit(): RateLimitResult {
    const now = Date.now();
    const state = storage.get(this.key) || {
      requests: [],
      blockedUntil: null,
      violationCount: 0,
    };

    // Check if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: state.blockedUntil,
        retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
      };
    }

    // Clear expired block
    if (state.blockedUntil && now >= state.blockedUntil) {
      state.blockedUntil = null;
      state.violationCount = 0;
    }

    // Clean old requests (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    state.requests = state.requests.filter(t => t > oneHourAgo);

    // Check limits
    const oneMinuteAgo = now - 60 * 1000;
    const requestsInLastMinute = state.requests.filter(t => t > oneMinuteAgo).length;
    const requestsInLastHour = state.requests.length;

    // Burst limit check
    if (this.config.burstLimit && requestsInLastMinute >= this.config.burstLimit) {
      // Add small delay for burst protection
      const lastRequest = state.requests[state.requests.length - 1];
      if (lastRequest && now - lastRequest < 100) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: lastRequest + 100,
          retryAfter: 1,
        };
      }
    }

    // Per-minute limit
    if (requestsInLastMinute >= this.config.requestsPerMinute) {
      // Block for remaining time in minute
      const oldestInWindow = state.requests.find(t => t > oneMinuteAgo) || now;
      const blockUntil = oldestInWindow + 60 * 1000;
      state.blockedUntil = blockUntil;
      state.violationCount++;
      storage.set(this.key, state);

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        retryAfter: Math.ceil((blockUntil - now) / 1000),
      };
    }

    // Per-hour limit
    if (requestsInLastHour >= this.config.requestsPerHour) {
      const oldestInHour = state.requests[0] || now;
      const blockUntil = oldestInHour + 60 * 60 * 1000;
      state.blockedUntil = blockUntil;
      state.violationCount++;
      storage.set(this.key, state);

      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        retryAfter: Math.ceil((blockUntil - now) / 1000),
      };
    }

    // Request allowed
    const remaining = Math.min(
      this.config.requestsPerMinute - requestsInLastMinute - 1,
      this.config.requestsPerHour - requestsInLastHour - 1
    );

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetTime: now + 60 * 1000,
    };
  }

  /**
   * Record a request (call this after checkLimit returns allowed: true)
   */
  recordRequest(): void {
    const state = storage.get(this.key) || {
      requests: [],
      blockedUntil: null,
      violationCount: 0,
    };

    state.requests.push(Date.now());
    storage.set(this.key, state);
  }

  /**
   * Check and record in one call
   */
  throttle(): RateLimitResult {
    const result = this.checkLimit();
    if (result.allowed) {
      this.recordRequest();
    }
    return result;
  }

  /**
   * Get current state (for debugging)
   */
  getState(): RateLimitState | null {
    return storage.get(this.key);
  }

  /**
   * Reset limits (for testing or admin)
   */
  reset(): void {
    storage.set(this.key, {
      requests: [],
      blockedUntil: null,
      violationCount: 0,
    });
  }
}

// ==================== CONVENIENCE FUNCTIONS ====================

const limiterCache = new Map<string, RateLimiter>();

export function getRateLimiter(key: string, config?: RateLimitConfig): RateLimiter {
  const cacheKey = `${key}_${JSON.stringify(config)}`;
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(cacheKey, new RateLimiter(key, config));
  }
  return limiterCache.get(cacheKey)!;
}

export function checkRateLimit(key: string): RateLimitResult {
  return getRateLimiter(key).throttle();
}

export function isRateLimited(key: string): boolean {
  return !checkRateLimit(key).allowed;
}

// ==================== DECORATOR PATTERN ====================

export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  config?: RateLimitConfig
): (...args: Parameters<T>) => Promise<ReturnType<T> | { error: string; retryAfter: number }> {
  const limiter = getRateLimiter(key, config);

  return async (...args: Parameters<T>) => {
    const result = limiter.throttle();

    if (!result.allowed) {
      return {
        error: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter || 60,
      };
    }

    return fn(...args);
  };
}

// ==================== REACT HOOK ====================

import { useState, useCallback, useRef } from 'react';

export interface UseRateLimitReturn {
  checkLimit: () => RateLimitResult;
  isLimited: boolean;
  retryAfter: number;
  reset: () => void;
}

export function useRateLimit(key: string, config?: RateLimitConfig): UseRateLimitReturn {
  const limiterRef = useRef(new RateLimiter(key, config));
  const [state, setState] = useState({ isLimited: false, retryAfter: 0 });

  const checkLimit = useCallback((): RateLimitResult => {
    const result = limiterRef.current.throttle();
    setState({
      isLimited: !result.allowed,
      retryAfter: result.retryAfter || 0,
    });
    return result;
  }, []);

  const reset = useCallback(() => {
    limiterRef.current.reset();
    setState({ isLimited: false, retryAfter: 0 });
  }, []);

  return {
    checkLimit,
    isLimited: state.isLimited,
    retryAfter: state.retryAfter,
    reset,
  };
}

// ==================== API INTEGRATION ====================

export interface FetchWithRateLimitOptions extends RequestInit {
  rateLimitKey?: string;
  rateLimitConfig?: RateLimitConfig;
  skipRateLimit?: boolean;
}

export async function fetchWithRateLimit(
  url: string,
  options: FetchWithRateLimitOptions = {}
): Promise<Response> {
  const { rateLimitKey = 'api/default', rateLimitConfig, skipRateLimit, ...fetchOptions } = options;

  if (!skipRateLimit) {
    const limiter = getRateLimiter(rateLimitKey, rateLimitConfig);
    const result = limiter.throttle();

    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${result.retryAfter} seconds.`,
        result.retryAfter || 60
      );
    }
  }

  return fetch(url, fetchOptions);
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ==================== SERVER-SIDE COMPATIBLE CODE ====================
/**
 * This section contains the exact code that will be used in Supabase Edge Functions.
 * When migrating to server-side, copy this section directly.
 */

/*
// Deno/Edge Function version:

interface EdgeRateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit?: number;
}

interface EdgeRateLimitState {
  requests: number[];
  blockedUntil: number | null;
  violationCount: number;
}

// In-memory store for Edge Function (per-instance)
const edgeStore = new Map<string, EdgeRateLimitState>();

export function checkEdgeRateLimit(
  identifier: string, // IP address or user ID
  config: EdgeRateLimitConfig
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const state = edgeStore.get(identifier) || {
    requests: [],
    blockedUntil: null,
    violationCount: 0,
  };

  // Check block status
  if (state.blockedUntil && now < state.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  // Clear expired block
  if (state.blockedUntil && now >= state.blockedUntil) {
    state.blockedUntil = null;
    state.violationCount = 0;
  }

  // Clean old requests
  const oneHourAgo = now - 60 * 60 * 1000;
  state.requests = state.requests.filter(t => t > oneHourAgo);

  // Check limits
  const oneMinuteAgo = now - 60 * 1000;
  const requestsInLastMinute = state.requests.filter(t => t > oneMinuteAgo).length;
  const requestsInLastHour = state.requests.length;

  if (requestsInLastMinute >= config.requestsPerMinute) {
    const blockDuration = Math.min(60 * 1000 * (state.violationCount + 1), 300000); // Max 5 min
    state.blockedUntil = now + blockDuration;
    state.violationCount++;
    edgeStore.set(identifier, state);

    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(blockDuration / 1000),
    };
  }

  if (requestsInLastHour >= config.requestsPerHour) {
    const blockDuration = 60 * 60 * 1000;
    state.blockedUntil = now + blockDuration;
    state.violationCount++;
    edgeStore.set(identifier, state);

    return {
      allowed: false,
      remaining: 0,
      retryAfter: 3600,
    };
  }

  // Record request
  state.requests.push(now);
  edgeStore.set(identifier, state);

  return {
    allowed: true,
    remaining: config.requestsPerMinute - requestsInLastMinute - 1,
  };
}
*/

// ==================== INITIALIZATION ====================

export function initRateLimiting(): void {
  // Clear stale data on app start
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Remove if all requests are older than 1 day
            if (parsed.requests?.every((t: number) => t < oneDayAgo)) {
              localStorage.removeItem(key);
            }
          } catch {}
        }
      }
    }
  } catch {}

  console.log('[Rate Limiting] Initialized');
}
