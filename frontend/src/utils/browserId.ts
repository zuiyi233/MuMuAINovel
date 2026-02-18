import { idbGet, idbPut, STORE_NAMES } from './indexedDb';

const LOCAL_STORAGE_KEY = 'mumu_browser_id';
const META_KEY = 'browser_id';
const FALLBACK_BROWSER_ID = 'server';

type BrowserIdMeta = {
  key: string;
  value: string;
  updated_at: string;
};

let cachedBrowserId: string | null = null;

const isBrowser = (): boolean => typeof window !== 'undefined';

const generateBrowserId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `browser_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const persistToLocalStorage = (browserId: string): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, browserId);
  } catch {
    // Ignore localStorage write failures.
  }
};

const readFromLocalStorage = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistToIndexedDb = async (browserId: string): Promise<void> => {
  const record: BrowserIdMeta = {
    key: META_KEY,
    value: browserId,
    updated_at: new Date().toISOString(),
  };
  await idbPut(STORE_NAMES.meta, record);
};

const readFromIndexedDb = async (): Promise<string | null> => {
  const record = await idbGet<BrowserIdMeta>(STORE_NAMES.meta, META_KEY);
  return record?.value ?? null;
};

export const getOrCreateBrowserId = async (): Promise<string> => {
  if (!isBrowser()) {
    return FALLBACK_BROWSER_ID;
  }

  if (cachedBrowserId) {
    return cachedBrowserId;
  }

  const localBrowserId = readFromLocalStorage();
  if (localBrowserId) {
    cachedBrowserId = localBrowserId;
    void persistToIndexedDb(localBrowserId).catch(() => {
      // Ignore IndexedDB failure and keep localStorage fallback.
    });
    return localBrowserId;
  }

  try {
    const idbBrowserId = await readFromIndexedDb();
    if (idbBrowserId) {
      cachedBrowserId = idbBrowserId;
      persistToLocalStorage(idbBrowserId);
      return idbBrowserId;
    }
  } catch {
    // Ignore IndexedDB read failures and fallback to localStorage/new ID.
  }

  const newBrowserId = generateBrowserId();
  cachedBrowserId = newBrowserId;
  persistToLocalStorage(newBrowserId);
  try {
    await persistToIndexedDb(newBrowserId);
  } catch {
    // Ignore IndexedDB write failures and keep localStorage fallback.
  }
  return newBrowserId;
};

