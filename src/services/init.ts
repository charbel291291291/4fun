/**
 * Service Initialization
 * Centralized initialization for all services
 */

import { initMonitoring } from './monitoring';
import { initRateLimiting } from './rateLimiter';
import { initBackupSystem } from './backup';

export interface InitOptions {
  monitoring?: boolean;
  rateLimiting?: boolean;
  backup?: boolean;
}

export function initServices(options: InitOptions = {}): void {
  const {
    monitoring = true,
    rateLimiting = true,
    backup = true,
  } = options;

  if (monitoring) {
    initMonitoring();
  }

  if (rateLimiting) {
    initRateLimiting();
  }

  if (backup) {
    initBackupSystem();
  }

  console.log('[Services] All services initialized');
}
