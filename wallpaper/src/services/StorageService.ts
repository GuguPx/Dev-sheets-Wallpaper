/**
 * Abstração de persistência local.
 * - localStorage: settings, favoritos, histórico, mais-usados (pequenos, síncronos).
 * - IndexedDB: anotações (potencialmente maiores).
 *
 * Tudo é offline; nenhuma requisição externa (seções 13/27). Degrada com
 * segurança quando o storage não está disponível (ex.: modo restrito do CEF).
 */

const PREFIX = 'devsheet:';

// --------------------------- localStorage (JSON) ---------------------------

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] falha ao ler "${key}":`, err);
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] falha ao gravar "${key}":`, err);
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

// ------------------------------- IndexedDB --------------------------------

const DB_NAME = 'devsheet';
const DB_VERSION = 1;
export const STORE_NOTES = 'notes';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        const notes = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
        notes.createIndex('technologyId', 'technologyId', { unique: false });
        notes.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  try {
    const db = await openDB();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[idb] getAll(${store}) falhou, retornando vazio:`, err);
    return [];
  }
}

export async function idbPut<T>(store: string, value: T): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
