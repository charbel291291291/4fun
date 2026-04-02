/**
 * Backup & Data Export Service
 * Client-side backup functionality with export/import capabilities.
 * Designed to work with localStorage and prepare for server-side backup integration.
 */

import type { Model, Supervisor, Notification, WhatsAppMessage } from '../types';

// ==================== TYPES ====================

export interface BackupMetadata {
  version: string;
  createdAt: string;
  exportedBy: string;
  appVersion: string;
  dataTypes: string[];
}

export interface BackupData {
  metadata: BackupMetadata;
  models?: Model[];
  supervisors?: Supervisor[];
  notifications?: Notification[];
  messages?: WhatsAppMessage[];
  settings?: Record<string, any>;
  localStorage?: Record<string, string>;
}

export interface BackupSchedule {
  enabled: boolean;
  interval: 'daily' | 'weekly' | 'monthly';
  lastBackup: string | null;
  autoDownload: boolean;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
  timestamp: string;
}

// ==================== CONFIGURATION ====================

const BACKUP_KEY = 'app_backup_schedule';
const LAST_BACKUP_KEY = 'app_last_backup';
const BACKUP_VERSION = '1.0.0';

// ==================== CORE BACKUP FUNCTIONS ====================

/**
 * Collect all app data for backup
 */
export function collectBackupData(): BackupData {
  const metadata: BackupMetadata = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    exportedBy: 'system',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    dataTypes: [],
  };

  const data: BackupData = {
    metadata,
  };

  // Collect localStorage data (excluding sensitive keys)
  const localStorageData: Record<string, string> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'pin'];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageData[key] = value;
        }
      }
    }
    if (Object.keys(localStorageData).length > 0) {
      data.localStorage = localStorageData;
      metadata.dataTypes.push('localStorage');
    }
  } catch (e) {
    console.warn('[Backup] Could not access localStorage:', e);
  }

  // Note: In a real implementation with Supabase,
  // this would fetch from the database instead

  return data;
}

/**
 * Export data to JSON file
 */
export function exportToJSON(data?: BackupData, filename?: string): BackupResult {
  try {
    const backupData = data || collectBackupData();
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    const defaultFilename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    const actualFilename = filename || defaultFilename;

    downloadBlob(blob, actualFilename);

    // Update last backup time
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

    return {
      success: true,
      filename: actualFilename,
      size: blob.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Export data to CSV (for specific data types)
 */
export function exportToCSV(
  data: any[],
  columns: { key: string; header: string }[],
  filename: string
): BackupResult {
  try {
    // Create CSV header
    const headers = columns.map(c => c.header).join(',');

    // Create CSV rows
    const rows = data.map(row => {
      return columns
        .map(col => {
          const value = row[col.key];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    downloadBlob(blob, filename);

    return {
      success: true,
      filename,
      size: blob.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== IMPORT FUNCTIONS ====================

/**
 * Read and parse a backup file
 */
export async function readBackupFile(file: File): Promise<BackupData | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as BackupData;

        // Validate backup format
        if (!data.metadata || !data.metadata.version) {
          reject(new Error('Invalid backup file format'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Restore data from backup
 */
export async function restoreFromBackup(
  data: BackupData,
  options: { restoreSettings?: boolean; mergeData?: boolean } = {}
): Promise<BackupResult> {
  try {
    const { restoreSettings = true, mergeData = false } = options;

    // Restore localStorage (with safety checks)
    if (restoreSettings && data.localStorage) {
      const protectedKeys = ['backup_schedule', 'session_id'];

      for (const [key, value] of Object.entries(data.localStorage)) {
        if (!protectedKeys.includes(key)) {
          if (mergeData) {
            // Only restore if key doesn't exist
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, value);
            }
          } else {
            localStorage.setItem(key, value);
          }
        }
      }
    }

    // Note: In a real implementation with Supabase,
    // this would restore database records

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// ==================== SCHEDULED BACKUPS ====================

export function getBackupSchedule(): BackupSchedule {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  return {
    enabled: false,
    interval: 'weekly',
    lastBackup: null,
    autoDownload: false,
  };
}

export function setBackupSchedule(schedule: BackupSchedule): void {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(schedule));
}

export function shouldRunScheduledBackup(): boolean {
  const schedule = getBackupSchedule();

  if (!schedule.enabled) return false;

  if (!schedule.lastBackup) return true;

  const lastBackup = new Date(schedule.lastBackup);
  const now = new Date();
  const diffMs = now.getTime() - lastBackup.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (schedule.interval) {
    case 'daily':
      return diffDays >= 1;
    case 'weekly':
      return diffDays >= 7;
    case 'monthly':
      return diffDays >= 30;
    default:
      return false;
  }
}

export function runScheduledBackupIfNeeded(): BackupResult | null {
  if (!shouldRunScheduledBackup()) return null;

  const result = exportToJSON();

  if (result.success) {
    const schedule = getBackupSchedule();
    schedule.lastBackup = new Date().toISOString();
    setBackupSchedule(schedule);
  }

  return result;
}

// ==================== CLOUD BACKUP (Future Supabase Integration) ====================

export interface CloudBackupConfig {
  enabled: boolean;
  provider: 'supabase' | 's3' | 'google_drive';
  autoSync: boolean;
  encryptionEnabled: boolean;
}

/**
 * Upload backup to cloud storage (placeholder for future implementation)
 */
export async function uploadToCloud(
  data: BackupData,
  config: CloudBackupConfig
): Promise<BackupResult> {
  // This is a placeholder for future Supabase Storage integration
  // When Supabase is connected, this will:
  // 1. Encrypt the data if encryptionEnabled
  // 2. Upload to Supabase Storage
  // 3. Return the storage path

  console.log('[Backup] Cloud upload not yet implemented', { config });

  return {
    success: false,
    error: 'Cloud backup not yet implemented. Please use local export.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Download backup from cloud storage (placeholder for future implementation)
 */
export async function downloadFromCloud(
  backupId: string,
  config: CloudBackupConfig
): Promise<BackupData | null> {
  // Placeholder for future Supabase Storage integration
  console.log('[Backup] Cloud download not yet implemented', { backupId, config });
  return null;
}

// ==================== BACKUP HISTORY ====================

const BACKUP_HISTORY_KEY = 'app_backup_history';

export interface BackupHistoryEntry {
  id: string;
  timestamp: string;
  type: 'manual' | 'scheduled' | 'auto';
  filename?: string;
  size?: number;
  success: boolean;
  error?: string;
}

export function addBackupHistory(entry: BackupHistoryEntry): void {
  try {
    const history = getBackupHistory();
    history.unshift(entry);

    // Keep only last 50 entries
    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function getBackupHistory(): BackupHistoryEntry[] {
  try {
    const stored = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  return [];
}

export function clearBackupHistory(): void {
  localStorage.removeItem(BACKUP_HISTORY_KEY);
}

// ==================== REACT HOOK ====================

import { useState, useCallback, useEffect } from 'react';

export interface UseBackupReturn {
  backup: () => Promise<BackupResult>;
  restore: (file: File) => Promise<BackupResult>;
  exportCSV: (
    data: any[],
    columns: { key: string; header: string }[],
    filename: string
  ) => BackupResult;
  schedule: BackupSchedule;
  setSchedule: (schedule: BackupSchedule) => void;
  history: BackupHistoryEntry[];
  lastBackup: string | null;
  isBackingUp: boolean;
}

export function useBackup(): UseBackupReturn {
  const [schedule, setScheduleState] = useState<BackupSchedule>(getBackupSchedule());
  const [history, setHistory] = useState<BackupHistoryEntry[]>(getBackupHistory());
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem(LAST_BACKUP_KEY)
  );
  const [isBackingUp, setIsBackingUp] = useState(false);

  const backup = useCallback(async (): Promise<BackupResult> => {
    setIsBackingUp(true);

    const result = exportToJSON();

    if (result.success) {
      setLastBackup(new Date().toISOString());
      addBackupHistory({
        id: `backup_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual',
        filename: result.filename,
        size: result.size,
        success: true,
      });
      setHistory(getBackupHistory());
    } else {
      addBackupHistory({
        id: `backup_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual',
        success: false,
        error: result.error,
      });
      setHistory(getBackupHistory());
    }

    setIsBackingUp(false);
    return result;
  }, []);

  const restore = useCallback(async (file: File): Promise<BackupResult> => {
    setIsBackingUp(true);

    try {
      const data = await readBackupFile(file);
      if (!data) {
        throw new Error('Failed to read backup file');
      }

      const result = await restoreFromBackup(data);

      addBackupHistory({
        id: `restore_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual',
        success: result.success,
        error: result.error,
      });
      setHistory(getBackupHistory());

      setIsBackingUp(false);
      return result;
    } catch (error) {
      setIsBackingUp(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const exportCSV = useCallback(
    (
      data: any[],
      columns: { key: string; header: string }[],
      filename: string
    ): BackupResult => {
      return exportToCSV(data, columns, filename);
    },
    []
  );

  const setSchedule = useCallback((newSchedule: BackupSchedule): void => {
    setBackupSchedule(newSchedule);
    setScheduleState(newSchedule);
  }, []);

  // Check for scheduled backup on mount
  useEffect(() => {
    const checkScheduled = () => {
      const result = runScheduledBackupIfNeeded();
      if (result) {
        addBackupHistory({
          id: `backup_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'scheduled',
          filename: result.filename,
          size: result.size,
          success: result.success,
          error: result.error,
        });
        setHistory(getBackupHistory());
        setLastBackup(new Date().toISOString());
      }
    };

    checkScheduled();

    // Check every hour
    const interval = setInterval(checkScheduled, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    backup,
    restore,
    exportCSV,
    schedule,
    setSchedule,
    history,
    lastBackup,
    isBackingUp,
  };
}

// ==================== INITIALIZATION ====================

export function initBackupSystem(): void {
  console.log('[Backup] System initialized');

  // Run scheduled backup check on startup
  const result = runScheduledBackupIfNeeded();
  if (result?.success) {
    console.log('[Backup] Scheduled backup completed:', result.filename);
  }
}
