const DB_NAME = 'finlytics_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_transactions';

export interface OfflineTransaction {
  tempId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  account: string;
  paymentMethod: string;
  date: string;
  description: string;
  notes?: string;
  createdAt: number;
}

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addOfflineTransaction(tx: Omit<OfflineTransaction, 'tempId' | 'createdAt'>): Promise<OfflineTransaction> {
  const db = await openIndexedDB();
  const item: OfflineTransaction = {
    ...tx,
    tempId: 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.add(item);

    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineTransactions(): Promise<OfflineTransaction[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return [];
  }
}

export async function removeOfflineTransaction(tempId: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.delete(tempId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearOfflineTransactions(): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Ignore if not supported
  }
}
