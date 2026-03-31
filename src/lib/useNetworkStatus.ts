/**
 * useNetworkStatus.ts
 * Tracks online/offline status and connection quality.
 * Integrates with errorLogger for silent tracking.
 * Fires onRestore callback when connection is restored (for auto-retry).
 */

import { useState, useEffect, useRef } from 'react';
import { setOfflineStatus } from './errorLogger';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;       // true if came back from offline this session
  justRestored: boolean;     // true for 3s after coming back online
}

export function useNetworkStatus(onRestore?: () => void): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [justRestored, setJustRestored] = useState(false);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wentOfflineRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineStatus(false);

      if (wentOfflineRef.current) {
        setWasOffline(true);
        setJustRestored(true);
        onRestore?.();

        restoreTimerRef.current = setTimeout(() => {
          setJustRestored(false);
        }, 3000);
      }
      wentOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineStatus(true);
      wentOfflineRef.current = true;
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, [onRestore]);

  return { isOnline, wasOffline, justRestored };
}
