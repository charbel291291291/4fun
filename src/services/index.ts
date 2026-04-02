/**
 * Services Index
 * Centralized exports for all service modules
 */

// Initialization
export { initServices, type InitOptions } from './init';

// Monitoring & Logging
export {
  // Core monitoring
  monitoringStore,
  measurePerformance,
  createPerformanceTimer,
  trackUserAction,
  trackPageView,
  trackApiMetric,
  trackError,
  initMonitoring,
  initWebVitals,
  initMemoryMonitoring,
  exportMonitoringData,
  downloadMonitoringReport,
  getMonitoringSummary,

  // Types
  type PerformanceMetric,
  type UserAction,
  type PageView,
  type ApiMetric,
  type SystemMetrics,
  type MonitoringSummary,
} from './monitoring';

// Rate Limiting
export {
  // Core rate limiting
  RateLimiter,
  getRateLimiter,
  checkRateLimit,
  isRateLimited,
  withRateLimit,
  fetchWithRateLimit,
  initRateLimiting,
  RateLimitError,

  // React hook
  useRateLimit,

  // Configs
  DEFAULT_LIMITS,

  // Types
  type RateLimitConfig,
  type RateLimitState,
  type RateLimitResult,
  type UseRateLimitReturn,
} from './rateLimiter';

// Backup & Export
export {
  // Core backup functions
  collectBackupData,
  exportToJSON,
  exportToCSV,
  readBackupFile,
  restoreFromBackup,

  // Scheduled backups
  getBackupSchedule,
  setBackupSchedule,
  shouldRunScheduledBackup,
  runScheduledBackupIfNeeded,

  // Cloud backup (future)
  uploadToCloud,
  downloadFromCloud,

  // History
  addBackupHistory,
  getBackupHistory,
  clearBackupHistory,

  // React hook
  useBackup,

  // Init
  initBackupSystem,

  // Types
  type BackupMetadata,
  type BackupData,
  type BackupSchedule,
  type BackupResult,
  type CloudBackupConfig,
  type BackupHistoryEntry,
  type UseBackupReturn,
} from './backup';

// Optimized Queries
export {
  // Core query functions
  getModelsPaginated,
  getModelById,
  getModelsByIds,
  getNotificationsPaginated,
  getMessagesForModel,
  getDashboardStats,
  getSupervisorStats,
  searchModels,
  initializeMockData,

  // Cache management
  queryCache,
  invalidateModelCache,
  invalidateNotificationCache,
  invalidateMessageCache,

  // Real-time helpers
  handleRealtimeModelChange,

  // Types
  type PaginationOptions,
  type FilterOptions,
  type SortOptions,
  type PaginatedResult,
  type DashboardStats,
  type SupervisorStats,
  type ChangeEvent,
  type RealtimeChange,
} from './optimizedQueries';

// React Hooks
export {
  useModelsPaginated,
  useModel,
  useNotifications,
  useMessages,
  useDashboardStats,
  useSupervisorStats,
  useModelSearch,
  useInfiniteModels,
} from './useOptimizedQueries';
