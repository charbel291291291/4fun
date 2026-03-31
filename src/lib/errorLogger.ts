/**
 * errorLogger.ts
 * Silent background error logging system.
 * Tracks all API failures, retry counts, and system health per session.
 * Built for future admin dashboard integration.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ErrorCategory =
  | 'server_error'     // 5xx
  | 'client_error'     // 4xx
  | 'network_error'    // offline / timeout
  | 'unknown_error'    // uncaught / boundary
  | 'react_error';     // ErrorBoundary catch

export interface ErrorLogEntry {
  id: string;
  category: ErrorCategory;
  message: string;          // sanitized, never raw user-facing
  endpoint?: string;
  statusCode?: number;
  retryCount: number;
  timestamp: string;        // ISO 8601
  sessionId: string;
  resolved: boolean;        // did retry succeed?
}

export interface SessionHealth {
  sessionId: string;
  startedAt: string;
  totalErrors: number;
  serverErrors: number;
  networkErrors: number;
  clientErrors: number;
  unknownErrors: number;
  totalRetries: number;
  successfulRetries: number;
  currentlyOffline: boolean;
}

// ─────────────────────────────────────────────
// Session ID (persists for browser session)
// ─────────────────────────────────────────────

const SESSION_ID_KEY = 'eyedeaz_session_id';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

// ─────────────────────────────────────────────
// In-memory log store (exportable to API later)
// ─────────────────────────────────────────────

const MAX_LOG_ENTRIES = 200;
let logStore: ErrorLogEntry[] = [];
let entryCounter = 0;

const sessionHealth: SessionHealth = {
  sessionId: getOrCreateSessionId(),
  startedAt: new Date().toISOString(),
  totalErrors: 0,
  serverErrors: 0,
  networkErrors: 0,
  clientErrors: 0,
  unknownErrors: 0,
  totalRetries: 0,
  successfulRetries: 0,
  currentlyOffline: !navigator.onLine,
};

// ─────────────────────────────────────────────
// Classify HTTP status code
// ─────────────────────────────────────────────

export type HttpErrorCategory = 'server_error' | 'client_error' | 'network_error' | 'unknown_error';

export function classifyHttpError(status?: number): HttpErrorCategory {
  if (!status) return 'network_error';
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'client_error';
  return 'unknown_error';
}

// ─────────────────────────────────────────────
// Core log function
// ─────────────────────────────────────────────

export function logError(params: {
  category: ErrorCategory;
  message: string;
  endpoint?: string;
  statusCode?: number;
  retryCount?: number;
  resolved?: boolean;
}): ErrorLogEntry {
  const entry: ErrorLogEntry = {
    id: `err_${++entryCounter}_${Date.now()}`,
    category: params.category,
    message: params.message,
    endpoint: params.endpoint,
    statusCode: params.statusCode,
    retryCount: params.retryCount ?? 0,
    timestamp: new Date().toISOString(),
    sessionId: sessionHealth.sessionId,
    resolved: params.resolved ?? false,
  };

  // Store (cap at max)
  logStore.push(entry);
  if (logStore.length > MAX_LOG_ENTRIES) {
    logStore = logStore.slice(-MAX_LOG_ENTRIES);
  }

  // Update session health counters
  sessionHealth.totalErrors++;
  if (params.category === 'server_error') sessionHealth.serverErrors++;
  else if (params.category === 'network_error') sessionHealth.networkErrors++;
  else if (params.category === 'client_error') sessionHealth.clientErrors++;
  else sessionHealth.unknownErrors++;
  if ((params.retryCount ?? 0) > 0) sessionHealth.totalRetries++;
  if (params.resolved) sessionHealth.successfulRetries++;

  // Silent console in development only
  if (import.meta.env.DEV) {
    const style = 'background:#1a0a2e;color:#a855f7;padding:2px 6px;border-radius:4px;font-weight:bold;';
    console.groupCollapsed(`%c[eyedeaz error] ${entry.category}`, style);
    console.table({
      id: entry.id,
      message: entry.message,
      endpoint: entry.endpoint ?? '—',
      statusCode: entry.statusCode ?? '—',
      retryCount: entry.retryCount,
      resolved: entry.resolved,
      timestamp: entry.timestamp,
    });
    console.groupEnd();
  }

  return entry;
}

// ─────────────────────────────────────────────
// Mark a previously logged error as resolved
// ─────────────────────────────────────────────

export function markResolved(entryId: string): void {
  const entry = logStore.find(e => e.id === entryId);
  if (entry) {
    entry.resolved = true;
    sessionHealth.successfulRetries++;
  }
}

// ─────────────────────────────────────────────
// Update offline status
// ─────────────────────────────────────────────

export function setOfflineStatus(offline: boolean): void {
  sessionHealth.currentlyOffline = offline;
  if (offline) {
    logError({
      category: 'network_error',
      message: 'User went offline',
    });
  }
}

// ─────────────────────────────────────────────
// Read access (for future admin dashboard)
// ─────────────────────────────────────────────

export function getErrorLog(): readonly ErrorLogEntry[] {
  return logStore;
}

export function getSessionHealth(): Readonly<SessionHealth> {
  return { ...sessionHealth };
}

export function clearLog(): void {
  logStore = [];
  entryCounter = 0;
}

// ─────────────────────────────────────────────
// Global unhandled rejection / error capture
// ─────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      category: 'unknown_error',
      message: 'Unhandled promise rejection',
      endpoint: undefined,
    });
    event.preventDefault(); // prevent console noise in prod
  });

  window.addEventListener('online', () => setOfflineStatus(false));
  window.addEventListener('offline', () => setOfflineStatus(true));
}
