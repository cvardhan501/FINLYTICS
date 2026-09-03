'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { syncOfflineTransactions } from '@/lib/pwa/syncManager';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => setIsOffline(true);
    const handleOnline = async () => {
      setIsOffline(false);
      setSyncStatus('Back online. Syncing changes...');
      const count = await syncOfflineTransactions();
      if (count > 0) {
        setSyncStatus(`All ${count} offline changes synced!`);
      } else {
        setSyncStatus('Connected to network');
      }
      setTimeout(() => setSyncStatus(''), 4000);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !syncStatus) return null;

  return (
    <div
      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors shadow-xs ${
        isOffline
          ? 'bg-amber-600 text-white'
          : 'bg-[#187A4E] text-white dark:bg-emerald-950 dark:text-emerald-300 border-b border-emerald-800'
      }`}
    >
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              You're currently offline. Saved information is accessible. New changes will sync when back online.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            <span>{syncStatus}</span>
          </>
        )}
      </div>
    </div>
  );
};
