/**
 * fetchWithRetry.ts
 * Production-grade fetch wrapper with:
 *  - Exponential backoff retry (up to 3 attempts)
 *  - Request deduplication (cancel duplicate in-flight calls)
 *  - Error classification (5xx / 4xx / network)
 *  - Silent logging via errorLogger
 *  - AbortController timeout support
 */

import { logError, markResolved, classifyHttpError } from './errorLogger';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FetchOptions extends RequestInit {
  /** Timeout per attempt in ms. Default: 10 000 */
  timeout?: number;
  /** Max retry attempts. Default: 3 */
  maxRetries?: number;
  /** Base backoff delay in ms. Doubles each retry. Default: 1 000 */
  baseDelay?: number;
  /** Unique key for deduplication. If same key is in-flight, previous is aborted. */
  dedupeKey?: string;
}

export interface FetchResult<T = unknown> {
  data: T | null;
  error: FetchError | null;
  retried: number;
}

export class FetchError extends Error {
  category: 'server_error' | 'client_error' | 'network_error' | 'unknown_error';
  statusCode?: number;
  endpoint: string;
  friendly: string;

  constructor(params: {
    message: string;
    category: FetchError['category'];
    statusCode?: number;
    endpoint: string;
  }) {
    super(params.message);
    this.name = 'FetchError';
    this.category = params.category;
    this.statusCode = params.statusCode;
    this.endpoint = params.endpoint;
    this.friendly = toFriendlyMessage(params.category, params.statusCode);
  }
}

// ─────────────────────────────────────────────
// Human-friendly error messages
// ─────────────────────────────────────────────

function toFriendlyMessage(
  category: FetchError['category'],
  statusCode?: number
): string {
  if (category === 'network_error') {
    return 'انقطع الاتصال. جاري إعادة الاتصال...';
  }
  if (category === 'server_error') {
    if (statusCode === 503 || statusCode === 502) {
      return 'الخدمة مشغولة حالياً، يرجى الانتظار لحظة.';
    }
    if (statusCode === 504) {
      return 'انتهت مهلة الاتصال. جاري إعادة المحاولة...';
    }
    return 'حدث خطأ في الخادم، جاري إعادة المحاولة...';
  }
  if (category === 'client_error') {
    if (statusCode === 401 || statusCode === 403) {
      return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.';
    }
    if (statusCode === 404) {
      return 'البيانات المطلوبة غير متاحة حالياً.';
    }
    return 'طلب غير صالح. يرجى المحاولة مرة أخرى.';
  }
  return 'حدث خطأ غير متوقع. جاري المعالجة...';
}

// ─────────────────────────────────────────────
// In-flight request deduplication map
// ─────────────────────────────────────────────

const inflight = new Map<string, AbortController>();

// ─────────────────────────────────────────────
// Sleep helper
// ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────

export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const {
    timeout = 10_000,
    maxRetries = 3,
    baseDelay = 1_000,
    dedupeKey,
    ...fetchOpts
  } = options;

  // Deduplicate: abort any previous call with same key
  if (dedupeKey) {
    const prev = inflight.get(dedupeKey);
    if (prev) {
      prev.abort();
    }
  }

  let retried = 0;
  let logEntryId: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    if (dedupeKey) {
      inflight.set(dedupeKey, abortController);
    }

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      if (dedupeKey) inflight.delete(dedupeKey);

      if (!response.ok) {
        const category = classifyHttpError(response.status);
        const err = new FetchError({
          message: `HTTP ${response.status}`,
          category,
          statusCode: response.status,
          endpoint: url,
        });

        // Don't retry client errors (4xx) — they won't self-heal
        if (category === 'client_error') {
          logEntryId = logError({
            category,
            message: err.message,
            endpoint: url,
            statusCode: response.status,
            retryCount: retried,
            resolved: false,
          }).id;
          return { data: null, error: err, retried };
        }

        // Server error → retry with backoff
        if (attempt < maxRetries) {
          retried++;
          const delay = baseDelay * Math.pow(2, attempt); // 1s → 2s → 4s
          logError({
            category,
            message: `${err.message} — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
            endpoint: url,
            statusCode: response.status,
            retryCount: retried,
          });
          await sleep(delay);
          continue;
        }

        // All retries exhausted
        logEntryId = logError({
          category,
          message: `${err.message} — all retries exhausted`,
          endpoint: url,
          statusCode: response.status,
          retryCount: retried,
          resolved: false,
        }).id;
        return { data: null, error: err, retried };
      }

      // ✅ Success
      const data: T = await response.json().catch(() => null);

      if (logEntryId) markResolved(logEntryId);

      return { data, error: null, retried };

    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (dedupeKey) inflight.delete(dedupeKey);

      // Aborted by deduplication or timeout
      if (e instanceof DOMException && e.name === 'AbortError') {
        const err = new FetchError({
          message: 'Request aborted (timeout or duplicate)',
          category: 'network_error',
          endpoint: url,
        });
        if (attempt < maxRetries) {
          retried++;
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        logError({
          category: 'network_error',
          message: 'Request timed out after all retries',
          endpoint: url,
          retryCount: retried,
        });
        return { data: null, error: err, retried };
      }

      // True network error (offline, DNS fail, etc.)
      const err = new FetchError({
        message: e instanceof Error ? e.message : 'Network error',
        category: 'network_error',
        endpoint: url,
      });

      if (attempt < maxRetries) {
        retried++;
        const delay = baseDelay * Math.pow(2, attempt);
        logError({
          category: 'network_error',
          message: `Network error — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          endpoint: url,
          retryCount: retried,
        });
        await sleep(delay);
        continue;
      }

      logEntryId = logError({
        category: 'network_error',
        message: 'Network error — all retries exhausted',
        endpoint: url,
        retryCount: retried,
        resolved: false,
      }).id;
      return { data: null, error: err, retried };
    }
  }

  // Unreachable, but TypeScript requires it
  return { data: null, error: new FetchError({ message: 'Unknown', category: 'unknown_error', endpoint: url }), retried };
}

// ─────────────────────────────────────────────
// Cancel all in-flight requests (e.g., on logout)
// ─────────────────────────────────────────────

export function cancelAllRequests(): void {
  inflight.forEach(ctrl => ctrl.abort());
  inflight.clear();
}
