import type { Artikel, Einkaufsliste, Einkaufsposition } from './api';

const DB_NAME = 'einkaufsliste-offline';
const DB_VERSION = 1;

interface SyncQueueEntry {
  id?: number;
  method: string;
  url: string;
  body?: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('artikel')) {
        db.createObjectStore('artikel', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('listen')) {
        db.createObjectStore('listen', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('positionen')) {
        const store = db.createObjectStore('positionen', { keyPath: 'id' });
        store.createIndex('liste_id', 'liste_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db: IDBDatabase, storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Artikel ---

export async function cacheArtikel(artikel: Artikel[]): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'artikel', 'readwrite');
  store.clear();
  artikel.forEach(a => store.put(a));
}

export async function getCachedArtikel(): Promise<Artikel[]> {
  const db = await openDB();
  return requestToPromise(tx(db, 'artikel').getAll());
}

// --- Listen ---

export async function cacheListen(listen: Einkaufsliste[]): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'listen', 'readwrite');
  store.clear();
  listen.forEach(l => store.put(l));
}

export async function getCachedListen(): Promise<Einkaufsliste[]> {
  const db = await openDB();
  return requestToPromise(tx(db, 'listen').getAll());
}

export async function addCachedListe(liste: Einkaufsliste): Promise<void> {
  const db = await openDB();
  tx(db, 'listen', 'readwrite').put(liste);
}

export async function removeCachedListe(id: number): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'positionen', 'readwrite');
  const index = store.index('liste_id');
  const keys = await requestToPromise(index.getAllKeys(id));
  keys.forEach(key => store.delete(key));

  const db2 = await openDB();
  tx(db2, 'listen', 'readwrite').delete(id);
}

// --- Positionen ---

export async function cachePositionen(listeId: number, positionen: Einkaufsposition[]): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'positionen', 'readwrite');
  // Remove old entries for this list
  const index = store.index('liste_id');
  const existingKeys = await requestToPromise(index.getAllKeys(listeId));
  existingKeys.forEach(key => store.delete(key));
  // Add new
  positionen.forEach(p => store.put(p));
}

export async function getCachedPositionen(listeId: number): Promise<Einkaufsposition[]> {
  const db = await openDB();
  const store = tx(db, 'positionen');
  const index = store.index('liste_id');
  return requestToPromise(index.getAll(listeId));
}

export async function updateCachedPosition(id: number, data: Partial<Einkaufsposition>): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'positionen', 'readwrite');
  const existing = await requestToPromise(store.get(id));
  if (existing) {
    store.put({ ...existing, ...data });
  }
}

export async function addCachedPosition(position: Einkaufsposition): Promise<void> {
  const db = await openDB();
  tx(db, 'positionen', 'readwrite').put(position);
}

export async function removeCachedPosition(id: number): Promise<void> {
  const db = await openDB();
  tx(db, 'positionen', 'readwrite').delete(id);
}

// --- Sync Queue ---

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp'>): Promise<void> {
  const db = await openDB();
  tx(db, 'syncQueue', 'readwrite').add({ ...entry, timestamp: Date.now() });
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await openDB();
  return requestToPromise(tx(db, 'syncQueue').getAll());
}

export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();
  tx(db, 'syncQueue', 'readwrite').clear();
}

export async function removeSyncQueueEntry(id: number): Promise<void> {
  const db = await openDB();
  tx(db, 'syncQueue', 'readwrite').delete(id);
}

export async function processSyncQueue(baseUrl: string): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const options: RequestInit = {
        method: entry.method,
        headers: entry.body ? { 'Content-Type': 'application/json' } : undefined,
        body: entry.body
      };
      const res = await fetch(`${baseUrl}${entry.url}`, options);
      if (res.ok) {
        await removeSyncQueueEntry(entry.id!);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
      break; // Still offline, stop processing
    }
  }

  return { success, failed };
}
