import { getOfflineTransactions, removeOfflineTransaction } from './indexedDB';

export async function syncOfflineTransactions(onSyncComplete?: (count: number) => void): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;

  const pending = await getOfflineTransactions();
  if (pending.length === 0) return 0;

  let syncedCount = 0;

  for (const item of pending) {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          amount: item.amount,
          category: item.category,
          account: item.account,
          paymentMethod: item.paymentMethod,
          date: item.date,
          description: item.description,
          notes: item.notes || '',
        }),
      });

      if (res.ok) {
        await removeOfflineTransaction(item.tempId);
        syncedCount++;
      }
    } catch (e) {
      console.error('[FINLYTICS PWA] Offline sync failed for item:', item.tempId, e);
    }
  }

  if (syncedCount > 0 && onSyncComplete) {
    onSyncComplete(syncedCount);
  }

  return syncedCount;
}
