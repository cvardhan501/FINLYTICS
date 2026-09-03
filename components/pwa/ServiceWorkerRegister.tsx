'use client';

import { useEffect } from 'react';
import { syncOfflineTransactions } from '@/lib/pwa/syncManager';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for service worker updates
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[FINLYTICS PWA] Service Worker updated to latest version.');
                }
              };
            }
          };
        })
        .catch((err) => {
          // Non-blocking log
          if (process.env.NODE_ENV === 'development') {
            console.warn('[FINLYTICS PWA] Service worker registration note:', err);
          }
        });

      // Automatic sync when returning online
      const handleOnline = () => {
        syncOfflineTransactions((count) => {
          console.log(`[FINLYTICS PWA] Successfully synced ${count} offline transactions.`);
        });
      };

      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, []);

  return null;
}
