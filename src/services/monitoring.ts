/**
 * Monitoring & Analytics Service
 * Production-grade monitoring with performance tracking, metrics collection,
 * and export capabilities for external analytics platforms
 */

import { logError, type ErrorCategory } from '../lib/errorLogger';

// ==================== TYPES ====================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: string;
  context?: Record<string, any>;
}

export interface UserAction {
  type: string;
  target?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  sessionId: string;
}

export interface PageView {
  path: string;
  referrer?: string;
  loadTime: number;
  timestamp: string;
  sessionId: string;
}

export interface ApiMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  timestamp: string;
}

export interface SystemMetrics {
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  performance?: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  };
}

// ==================== CONFIGURATION ====================

const CONFIG = {
  MAX_METRICS: 1000,
  MAX_ACTIONS: 500,
  MAX_API_METRICS: 200,
  SAMPLE_RATE: 1.0, // 100% sampling in development, reduce in production
  BATCH_SIZE: 50,
  FLUSH_INTERVAL: 30000, // 30 seconds
};

// ==================== STORAGE ====================

const SESSION_ID_KEY = 'monitoring_session_id';

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

class MonitoringStore {
  private metrics: PerformanceMetric[] = [];
  private actions: UserAction[] = [];
  private pageViews: PageView[] = [];
  private apiMetrics: ApiMetric[] = [];
  private sessionId = getOrCreateSessionId();

  // Metrics
  addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (Math.random() > CONFIG.SAMPLE_RATE) return;

    this.metrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });

    if (this.metrics.length > CONFIG.MAX_METRICS) {
      this.metrics = this.metrics.slice(-CONFIG.MAX_METRICS);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Actions
  trackAction(type: string, target?: string, metadata?: Record<string, any>): void {
    this.actions.push({
      type,
      target,
      metadata,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });

    if (this.actions.length > CONFIG.MAX_ACTIONS) {
      this.actions = this.actions.slice(-CONFIG.MAX_ACTIONS);
    }
  }

  getActions(): UserAction[] {
    return [...this.actions];
  }

  // Page Views
  trackPageView(path: string, loadTime: number, referrer?: string): void {
    this.pageViews.push({
      path,
      loadTime,
      referrer,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
  }

  getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  // API Metrics
  trackApiCall(metric: Omit<ApiMetric, 'timestamp'>): void {
    this.apiMetrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });

    if (this.apiMetrics.length > CONFIG.MAX_API_METRICS) {
      this.apiMetrics = this.apiMetrics.slice(-CONFIG.MAX_API_METRICS);
    }
  }

  getApiMetrics(): ApiMetric[] {
    return [...this.apiMetrics];
  }

  // Clear all data
  clear(): void {
    this.metrics = [];
    this.actions = [];
    this.pageViews = [];
    this.apiMetrics = [];
  }

  // Export for external analytics
  export(): {
    metrics: PerformanceMetric[];
    actions: UserAction[];
    pageViews: PageView[];
    apiMetrics: ApiMetric[];
    sessionId: string;
    exportedAt: string;
  } {
    return {
      metrics: this.getMetrics(),
      actions: this.getActions(),
      pageViews: this.getPageViews(),
      apiMetrics: this.getApiMetrics(),
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
    };
  }
}

export const monitoringStore = new MonitoringStore();

// ==================== PERFORMANCE MONITORING ====================

export function measurePerformance(
  name: string,
  fn: () => void | Promise<void>,
  context?: Record<string, any>
): Promise<void> {
  const start = performance.now();

  const recordMetric = () => {
    const duration = performance.now() - start;
    monitoringStore.addMetric({
      name,
      value: duration,
      unit: 'ms',
      context,
    });
  };

  const result = fn();
  if (result instanceof Promise) {
    return result.finally(recordMetric);
  } else {
    recordMetric();
    return Promise.resolve();
  }
}

export function createPerformanceTimer(name: string, context?: Record<string, any>) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      monitoringStore.addMetric({
        name,
        value: duration,
        unit: 'ms',
        context,
      });
      return duration;
    },
  };
}

// ==================== WEB VITALS ====================

export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // First Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcp = entries[entries.length - 1];
    if (fcp) {
      monitoringStore.addMetric({
        name: 'FCP',
        value: fcp.startTime,
        unit: 'ms',
      });
    }
  }).observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lcp = entries[entries.length - 1];
    if (lcp) {
      monitoringStore.addMetric({
        name: 'LCP',
        value: lcp.startTime,
        unit: 'ms',
      });
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      monitoringStore.addMetric({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        unit: 'ms',
      });
    });
  }).observe({ entryTypes: ['first-input'] });

  // Layout Shift
  new PerformanceObserver((list) => {
    let clsValue = 0;
    list.getEntries().forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    monitoringStore.addMetric({
      name: 'CLS',
      value: clsValue,
      unit: 'count',
    });
  }).observe({ entryTypes: ['layout-shift'] });

  // Navigation Timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        monitoringStore.addMetric({
          name: 'TTFB',
          value: navigation.responseStart - navigation.startTime,
          unit: 'ms',
        });
        monitoringStore.addMetric({
          name: 'DOMContentLoaded',
          value: navigation.domContentLoadedEventEnd - navigation.startTime,
          unit: 'ms',
        });
        monitoringStore.addMetric({
          name: 'LoadComplete',
          value: navigation.loadEventEnd - navigation.startTime,
          unit: 'ms',
        });
      }
    }, 0);
  });
}

// ==================== USER TRACKING ====================

export function trackUserAction(type: string, target?: string, metadata?: Record<string, any>): void {
  monitoringStore.trackAction(type, target, metadata);
}

export function trackPageView(path: string, referrer?: string): void {
  const startTime = performance.now();

  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    recordPageView();
  } else {
    window.addEventListener('load', recordPageView);
  }

  function recordPageView() {
    const loadTime = performance.now() - startTime;
    monitoringStore.trackPageView(path, loadTime, referrer);
  }
}

export function trackApiMetric(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
): void {
  monitoringStore.trackApiCall({
    endpoint,
    method,
    duration,
    statusCode,
    success: statusCode >= 200 && statusCode < 300,
  });
}

// ==================== ERROR TRACKING ====================

export function trackError(
  category: ErrorCategory,
  message: string,
  endpoint?: string,
  statusCode?: number
): void {
  logError({
    category,
    message,
    endpoint,
    statusCode,
  });

  monitoringStore.addMetric({
    name: `error_${category}`,
    value: 1,
    unit: 'count',
    context: { message, endpoint, statusCode },
  });
}

// ==================== MEMORY MONITORING ====================

export function initMemoryMonitoring(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  setInterval(() => {
    const memory = (performance as any).memory;
    if (memory) {
      monitoringStore.addMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
      });
      monitoringStore.addMetric({
        name: 'memory_total',
        value: memory.totalJSHeapSize,
        unit: 'bytes',
      });
      monitoringStore.addMetric({
        name: 'memory_limit',
        value: memory.jsHeapSizeLimit,
        unit: 'bytes',
      });
    }
  }, 30000); // Every 30 seconds
}

// ==================== EXPORT & REPORTING ====================

export function exportMonitoringData(): string {
  const data = monitoringStore.export();
  return JSON.stringify(data, null, 2);
}

export function downloadMonitoringReport(): void {
  const data = exportMonitoringData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface MonitoringSummary {
  totalErrors: number;
  avgPageLoadTime: number;
  totalApiCalls: number;
  apiSuccessRate: number;
  avgApiLatency: number;
  userActionsCount: number;
  pageViewsCount: number;
}

export function getMonitoringSummary(): MonitoringSummary {
  const apiMetrics = monitoringStore.getApiMetrics();
  const pageViews = monitoringStore.getPageViews();
  const actions = monitoringStore.getActions();

  const successfulApiCalls = apiMetrics.filter(m => m.success).length;
  const avgApiLatency = apiMetrics.length > 0
    ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
    : 0;

  const avgPageLoadTime = pageViews.length > 0
    ? pageViews.reduce((sum, p) => sum + p.loadTime, 0) / pageViews.length
    : 0;

  return {
    totalErrors: apiMetrics.filter(m => !m.success).length,
    avgPageLoadTime,
    totalApiCalls: apiMetrics.length,
    apiSuccessRate: apiMetrics.length > 0 ? (successfulApiCalls / apiMetrics.length) * 100 : 100,
    avgApiLatency,
    userActionsCount: actions.length,
    pageViewsCount: pageViews.length,
  };
}

// ==================== INITIALIZATION ====================

export function initMonitoring(): void {
  if (typeof window === 'undefined') return;

  initWebVitals();
  initMemoryMonitoring();

  // Track initial page view
  trackPageView(window.location.pathname, document.referrer);

  // Track route changes
  let lastPath = window.location.pathname;
  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      trackPageView(currentPath, lastPath);
      lastPath = currentPath;
    }
  }, 100);

  console.log('[Monitoring] Initialized');
}
