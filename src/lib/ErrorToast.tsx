/**
 * ErrorToast.tsx
 * Premium toast/snackbar notification system for error states.
 *
 * Toast types:
 *  - error      → red, for failures
 *  - retrying   → purple with spinner, for auto-retry in progress
 *  - success    → green, for recovery
 *  - offline    → dark amber, for offline state
 *  - restored   → gold, for reconnection
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast({ type: 'retrying', message: 'جاري إعادة المحاولة...' });
 */

import React, { createContext, useCallback, useContext, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ToastType = 'error' | 'retrying' | 'success' | 'offline' | 'restored' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss duration ms. 0 = persistent until manually dismissed. */
  duration?: number;
  /** Show a retry button */
  onRetry?: () => void;
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

const MAX_TOASTS = 4;

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD':
      // Replace same-type toast if already showing (avoid stacking duplicates)
      return [
        ...state.filter(t => t.type !== action.toast.type).slice(-(MAX_TOASTS - 1)),
        action.toast,
      ];
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface ToastContextValue {
  showToast: (params: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id });
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const showToast = useCallback((params: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = { ...params, id };
    dispatch({ type: 'ADD', toast });

    const duration = params.duration ?? defaultDuration(params.type);
    if (duration > 0) {
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismissToast]);

  const clearToasts = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Default durations
// ─────────────────────────────────────────────

function defaultDuration(type: ToastType): number {
  switch (type) {
    case 'offline': return 0;           // persistent until online
    case 'retrying': return 0;          // persistent until resolved
    case 'error': return 6000;
    case 'warning': return 5000;
    case 'success': return 3000;
    case 'restored': return 3500;
    default: return 4000;
  }
}

// ─────────────────────────────────────────────
// Toast visual config
// ─────────────────────────────────────────────

const toastConfig: Record<ToastType, {
  bg: string;
  border: string;
  icon: React.ReactNode;
  textColor: string;
}> = {
  error: {
    bg: 'bg-red-950/90',
    border: 'border-red-500/40',
    textColor: 'text-red-200',
    icon: (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  retrying: {
    bg: 'bg-purple-950/90',
    border: 'border-purple-500/40',
    textColor: 'text-purple-200',
    icon: <RetrySpinner />,
  },
  success: {
    bg: 'bg-green-950/90',
    border: 'border-green-500/40',
    textColor: 'text-green-200',
    icon: (
      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  offline: {
    bg: 'bg-zinc-900/95',
    border: 'border-amber-500/30',
    textColor: 'text-amber-200',
    icon: (
      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.111 8.111A7.5 7.5 0 0119.5 12M4.929 4.929A10.5 10.5 0 0121 12" />
      </svg>
    ),
  },
  restored: {
    bg: 'bg-brand-dark/95',
    border: 'border-brand-gold/40',
    textColor: 'text-yellow-200',
    icon: (
      <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-orange-950/90',
    border: 'border-orange-500/40',
    textColor: 'text-orange-200',
    icon: (
      <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
      </svg>
    ),
  },
};

// ─────────────────────────────────────────────
// Spinner (for retrying state)
// ─────────────────────────────────────────────

function RetrySpinner() {
  return (
    <svg
      className="w-4 h-4 text-purple-400 shrink-0 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Toast Container
// ─────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      dir="rtl"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
      aria-label="إشعارات النظام"
    >
      <AnimatePresence mode="sync">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Single Toast Item
// ─────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = toastConfig[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`pointer-events-auto w-full rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/50 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {cfg.icon}
        <span className={`flex-1 text-xs font-bold leading-snug ${cfg.textColor}`}>
          {toast.message}
        </span>
        {toast.onRetry && (
          <button
            onClick={() => { toast.onRetry!(); onDismiss(toast.id); }}
            className="text-[10px] font-black px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white shrink-0"
          >
            إعادة
          </button>
        )}
        {toast.type !== 'retrying' && toast.type !== 'offline' && (
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-white/20 hover:text-white/60 transition-colors shrink-0 p-0.5"
            aria-label="إغلاق"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Retry Progress Bar (shown during retrying states)
// ─────────────────────────────────────────────

export interface RetryState {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  message: string;
}

export function RetryProgressBar({ state }: { state: RetryState }) {
  if (!state.isRetrying) return null;

  const progress = (state.attempt / state.maxAttempts) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      dir="rtl"
      className="glass-card border-purple-500/20 bg-purple-500/5 p-3 space-y-2"
    >
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-purple-300 font-bold flex items-center gap-1.5">
          <RetrySpinner />
          {state.message}
        </span>
        <span className="text-white/30">
          {state.attempt}/{state.maxAttempts}
        </span>
      </div>
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
