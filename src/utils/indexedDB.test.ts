import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupExpiredData,
  clearAllData,
  deleteData,
  getAllKeys,
  getData,
  isIndexedDBAvailable,
  saveData,
} from './indexedDB';

type RequestLike = {
  result?: any;
  onsuccess?: (event: any) => void;
  onerror?: () => void;
};

const records = new Map<string, any>();
let failOpen = false;
let failOperation: string | null = null;

function request(result?: any, operation?: string): RequestLike {
  const req: RequestLike = { result };
  queueMicrotask(() => {
    if (failOperation === operation) req.onerror?.();
    else req.onsuccess?.({ target: req });
  });
  return req;
}

function createDatabase() {
  const store = {
    put: (data: any) => {
      records.set(data.id, data);
      return request(undefined, 'put');
    },
    get: (id: string) => request(records.get(id), 'get'),
    delete: (id: string) => {
      records.delete(id);
      return request(undefined, 'delete');
    },
    clear: () => {
      records.clear();
      return request(undefined, 'clear');
    },
    getAllKeys: () => request(Array.from(records.keys()), 'keys'),
    index: () => ({
      openCursor: () => {
        const expired = Array.from(records.values()).filter(item => item.expiresAt <= Date.now());
        let index = 0;
        const cursorRequest: RequestLike = {};
        queueMicrotask(() => {
          const advance = () => {
            const item = expired[index++];
            cursorRequest.onsuccess?.({ target: { result: item ? {
              delete: () => records.delete(item.id),
              continue: advance,
            } : null } });
          };
          advance();
        });
        return cursorRequest;
      },
    }),
    createIndex: vi.fn(),
  };

  const db = {
    objectStoreNames: { contains: () => false },
    createObjectStore: vi.fn(() => store),
    transaction: () => ({ objectStore: () => store }),
    close: vi.fn(),
  };
  return db;
}

let database: ReturnType<typeof createDatabase>;

beforeEach(() => {
  records.clear();
  failOpen = false;
  failOperation = null;
  database = createDatabase();
  vi.stubGlobal('indexedDB', {
    open: vi.fn(() => {
      const req: RequestLike = {};
      queueMicrotask(() => {
        if (failOpen) req.onerror?.();
        else {
          req.result = database;
          req.onupgradeneeded?.({ target: { result: database } });
          req.onsuccess?.();
        }
      });
      return req;
    }),
  });
  vi.stubGlobal('IDBKeyRange', { upperBound: (value: number) => value });
});

afterEach(() => vi.unstubAllGlobals());

describe('indexedDB utilities', () => {
  it('saves, reads, lists, deletes, and clears stored data', async () => {
    expect(isIndexedDBAvailable()).toBe(true);
    await saveData('profile', 'encrypted');
    expect(await getData('profile')).toBe('encrypted');
    expect(await getAllKeys()).toEqual(['profile']);
    await deleteData('profile');
    expect(await getData('profile')).toBeNull();
    await saveData('another', 'payload');
    await clearAllData();
    expect(await getAllKeys()).toEqual([]);
    expect(database.close).toHaveBeenCalled();
    expect(database.createObjectStore).toHaveBeenCalledWith('encryptedData', { keyPath: 'id' });
  });

  it('returns null for missing and expired values and cleans expired records', async () => {
    records.set('old', { id: 'old', encryptedPayload: 'stale', expiresAt: Date.now() - 1 });
    expect(await getData('missing')).toBeNull();
    expect(await getData('old')).toBeNull();
    await cleanupExpiredData();
    await Promise.resolve();
    expect(records.has('old')).toBe(false);
  });

  it('handles unavailable storage and operation failures gracefully', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(isIndexedDBAvailable()).toBe(false);
    expect(await getData('x')).toBeNull();
    expect(await getAllKeys()).toEqual([]);
    await expect(saveData('x', 'y')).rejects.toThrow('IndexedDB save operation failed');
    await expect(clearAllData()).rejects.toThrow('IndexedDB clear operation failed');
    await expect(deleteData('x')).resolves.toBeUndefined();
    await expect(cleanupExpiredData()).resolves.toBeUndefined();
  });

  it('wraps write, delete, clear, and key request errors', async () => {
    failOperation = 'put';
    await expect(saveData('x', 'y')).rejects.toThrow('Failed to save data');
    failOperation = 'delete';
    await expect(deleteData('x')).rejects.toThrow('Failed to delete data');
    failOperation = 'clear';
    await expect(clearAllData()).rejects.toThrow('Failed to clear data');
    failOperation = 'keys';
    await expect(getAllKeys()).rejects.toThrow('Failed to get keys');
    failOperation = 'get';
    await expect(getData('x')).rejects.toThrow('Failed to retrieve data');
  });

  it('silently handles database-open failures for cleanup and delete', async () => {
    failOpen = true;
    await expect(cleanupExpiredData()).resolves.toBeUndefined();
    await expect(deleteData('x')).resolves.toBeUndefined();
  });
});
