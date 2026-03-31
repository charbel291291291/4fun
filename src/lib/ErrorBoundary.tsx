/**
 * ErrorBoundary.tsx
 * React class-based error boundary.
 * Catches render/lifecycle errors, logs them silently, shows premium fallback UI.
 * Supports retry, and propagates nothing raw to the user.
 */

import React from 'react';
import { logError } from './errorLogger';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback — if not provided, uses default luxury UI */
  fallback?: React.ReactNode;
  /** Called when error is caught */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

// ─────────────────────────────────────────────
// ErrorBoundary
// ─────────────────────────────────────────────

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logError({
      category: 'react_error',
      message: error.message,
      retryCount: this.state.retryCount,
    });
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return <ErrorFallback onRetry={this.handleRetry} retryCount={this.state.retryCount} />;
  }
}

// ─────────────────────────────────────────────
// Default fallback UI  — matches luxury dark theme
// ─────────────────────────────────────────────

function ErrorFallback({
  onRetry,
  retryCount,
}: {
  onRetry: () => void;
  retryCount: number;
}) {
  const maxRetries = 2;
  const exhausted = retryCount >= maxRetries;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-brand-dark flex items-center justify-center p-8 text-white relative overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-purple/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-sm w-full text-center space-y-8 relative z-10">
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center">
            <svg
              className="w-9 h-9 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight">
            {exhausted ? 'تعذّر تحميل النظام' : 'حدث خطأ غير متوقع'}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {exhausted
              ? 'لم نتمكن من استعادة النظام تلقائياً. يرجى تحديث الصفحة أو التواصل مع الدعم.'
              : 'حدث خطأ في أحد مكونات النظام. يمكننا إصلاحه فوراً بدون فقدان بياناتك.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!exhausted && (
            <button
              onClick={onRetry}
              className="w-full py-4 bg-brand-gold text-black rounded-2xl font-black text-sm hover:bg-brand-gold/80 transition-all shadow-lg shadow-brand-gold/20 active:scale-95"
            >
              إعادة المحاولة
              {retryCount > 0 && (
                <span className="mr-2 text-black/50 font-normal text-xs">
                  ({retryCount}/{maxRetries})
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
          >
            تحديث الصفحة
          </button>
        </div>

        {/* Session info — subtle, non-alarming */}
        <p className="text-[10px] text-white/15 uppercase tracking-widest">
          eyedeaz system · auto-recovery active
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Lightweight section-level boundary
// (wraps individual views, not the whole app)
// ─────────────────────────────────────────────

export function SectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<SectionErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
}

function SectionErrorFallback() {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center py-20 gap-4 text-white/40"
    >
      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286z"
          />
        </svg>
      </div>
      <p className="text-sm font-bold">تعذّر تحميل هذا القسم</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-brand-gold/70 hover:text-brand-gold transition-colors font-bold"
      >
        تحديث الصفحة
      </button>
    </div>
  );
}
