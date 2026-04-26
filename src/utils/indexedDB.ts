/**
 * IndexedDB Wrapper for secure data persistence
 * 
 * Features:
 * - Versioned schema
 * - Auto-cleanup after 24 hours
 * - Stores only encrypted data
 * - Graceful fallback handling
 * 
 * SECURITY: Never store plain-text sensitive data
 */

const DB_NAME = 'OnterFinancialDB';
const DB_VERSION = 1;
const STORE_NAME = 'encryptedData';
const DATA_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredData {
  id: string;
  encryptedPayload: string; // JSON stringified encrypted data
  timestamp: number;
  expiresAt: number;
}

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save encrypted data to IndexedDB
 */
export async function saveData(id: string, encryptedPayload: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const now = Date.now();
    const data: StoredData = {
      id,
      encryptedPayload,
      timestamp: now,
      expiresAt: now + DATA_RETENTION_MS,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(data);

      request.onsuccess = () => {
        db.close();
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Failed to save data'));
      };
    });
  } catch (error) {
    throw new Error('IndexedDB save operation failed');
  }
}

/**
 * Get encrypted data from IndexedDB
 */
export async function getData(id: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result as StoredData | undefined;
        db.close();

        if (!data) {
          resolve(null);
          return;
        }

        // Check if data has expired
        if (Date.now() > data.expiresAt) {
          // Delete expired data
          deleteData(id).catch(() => {
            // Silently fail cleanup
          });
          resolve(null);
          return;
        }

        resolve(data.encryptedPayload);
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Failed to retrieve data'));
      };
    });
  } catch (error) {
    return null;
  }
}

/**
 * Delete data from IndexedDB
 */
export async function deleteData(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        db.close();
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Failed to delete data'));
      };
    });
  } catch (error) {
    // Silently fail
  }
}

/**
 * Clear all data from IndexedDB
 */
export async function clearAllData(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        db.close();
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Failed to clear data'));
      };
    });
  } catch (error) {
    throw new Error('IndexedDB clear operation failed');
  }
}

/**
 * Clean up expired data
 * Should be called on app initialization
 */
export async function cleanupExpiredData(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');

    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        db.close();
      }
    };

    request.onerror = () => {
      db.close();
    };
  } catch (error) {
    // Silently fail cleanup
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get all stored keys (for debugging - remove in production)
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();

      request.onsuccess = () => {
        db.close();
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Failed to get keys'));
      };
    });
  } catch (error) {
    return [];
  }
}
