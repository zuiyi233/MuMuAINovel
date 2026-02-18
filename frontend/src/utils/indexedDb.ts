export const DB_NAME = 'mumu_ai_novel_local';
export const DB_VERSION = 2;

export const STORE_NAMES = {
  meta: 'meta',
  projects: 'projects',
  outlines: 'outlines',
  chapters: 'chapters',
  characters: 'characters',
  organizations: 'organizations',
  organizationMembers: 'organization_members',
  relationships: 'relationships',
  foreshadows: 'foreshadows',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

const META_KEY_PATH = 'key';
const ENTITY_KEY_PATH: [string, string] = ['browser_id', 'id'];
const BROWSER_PROJECT_RANGE_MIN = '';
const BROWSER_PROJECT_RANGE_MAX = '\uffff';

let dbPromise: Promise<IDBDatabase> | null = null;

const isBrowser = (): boolean => typeof window !== 'undefined';

export const isIndexedDbSupported = (): boolean => isBrowser() && typeof indexedDB !== 'undefined';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });

const ensureStore = (
  db: IDBDatabase,
  tx: IDBTransaction,
  name: StoreName,
  keyPath: string | string[],
): IDBObjectStore => {
  if (db.objectStoreNames.contains(name)) {
    return tx.objectStore(name);
  }
  return db.createObjectStore(name, { keyPath });
};

const ensureIndex = (
  store: IDBObjectStore,
  indexName: string,
  keyPath: string | string[],
  options?: IDBIndexParameters,
): void => {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, options);
  }
};

const buildSchemaV1 = (db: IDBDatabase, tx: IDBTransaction): void => {
  ensureStore(db, tx, STORE_NAMES.meta, META_KEY_PATH);

  const projects = ensureStore(db, tx, STORE_NAMES.projects, ENTITY_KEY_PATH);
  ensureIndex(projects, 'by_browser_updated', ['browser_id', 'updated_at']);

  const outlines = ensureStore(db, tx, STORE_NAMES.outlines, ENTITY_KEY_PATH);
  ensureIndex(outlines, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(outlines, 'by_browser_project_order', ['browser_id', 'project_id', 'order_index']);

  const chapters = ensureStore(db, tx, STORE_NAMES.chapters, ENTITY_KEY_PATH);
  ensureIndex(chapters, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(chapters, 'by_browser_project_number', ['browser_id', 'project_id', 'chapter_number']);
  ensureIndex(chapters, 'by_browser_outline', ['browser_id', 'outline_id']);

  const characters = ensureStore(db, tx, STORE_NAMES.characters, ENTITY_KEY_PATH);
  ensureIndex(characters, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(characters, 'by_browser_project_org', ['browser_id', 'project_id', 'is_organization']);
};

const buildSchemaV2 = (db: IDBDatabase, tx: IDBTransaction): void => {
  const organizations = ensureStore(db, tx, STORE_NAMES.organizations, ENTITY_KEY_PATH);
  ensureIndex(organizations, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(organizations, 'by_browser_project_parent', ['browser_id', 'project_id', 'parent_org_id']);
  ensureIndex(organizations, 'by_browser_project_level', ['browser_id', 'project_id', 'level']);

  const organizationMembers = ensureStore(db, tx, STORE_NAMES.organizationMembers, ENTITY_KEY_PATH);
  ensureIndex(organizationMembers, 'by_browser_organization', ['browser_id', 'organization_id']);
  ensureIndex(organizationMembers, 'by_browser_organization_rank', ['browser_id', 'organization_id', 'rank']);
  ensureIndex(organizationMembers, 'by_browser_organization_updated', ['browser_id', 'organization_id', 'updated_at']);
  ensureIndex(organizationMembers, 'by_browser_character', ['browser_id', 'character_id']);

  const relationships = ensureStore(db, tx, STORE_NAMES.relationships, ENTITY_KEY_PATH);
  ensureIndex(relationships, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(relationships, 'by_browser_project_from_to', ['browser_id', 'project_id', 'character_from_id', 'character_to_id']);
  ensureIndex(relationships, 'by_browser_project_to_from', ['browser_id', 'project_id', 'character_to_id', 'character_from_id']);

  const foreshadows = ensureStore(db, tx, STORE_NAMES.foreshadows, ENTITY_KEY_PATH);
  ensureIndex(foreshadows, 'by_browser_project_updated', ['browser_id', 'project_id', 'updated_at']);
  ensureIndex(foreshadows, 'by_browser_project_status_updated', ['browser_id', 'project_id', 'status', 'updated_at']);
  ensureIndex(foreshadows, 'by_browser_project_plantChapter', ['browser_id', 'project_id', 'plant_chapter_number']);
};

export const openIndexedDb = async (): Promise<IDBDatabase> => {
  if (!isIndexedDbSupported()) {
    throw new Error('IndexedDB is not supported in current environment');
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction;
      if (!tx) {
        return;
      }
      const oldVersion = event.oldVersion;
      if (oldVersion < 1) {
        buildSchemaV1(db, tx);
      }
      if (oldVersion < 2) {
        buildSchemaV2(db, tx);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('Failed to open IndexedDB'));
    };
    request.onblocked = () => {
      reject(new Error('IndexedDB open request is blocked by another tab'));
    };
  });

  return dbPromise;
};

export const withTransaction = async <T>(
  stores: StoreName | StoreName[],
  mode: IDBTransactionMode,
  runner: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> => {
  const db = await openIndexedDb();
  const storeNames = Array.isArray(stores) ? stores : [stores];
  const tx = db.transaction(storeNames, mode);
  const done = transactionDone(tx);

  let result: T;
  try {
    result = await runner(tx);
  } catch (error) {
    tx.abort();
    throw error;
  }

  await done;
  return result;
};

export const idbGet = async <T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> =>
  withTransaction(store, 'readonly', async (tx) => {
    const request = tx.objectStore(store).get(key);
    const value = await requestToPromise(request);
    return value as T | undefined;
  });

export const idbPut = async <T>(store: StoreName, value: T): Promise<IDBValidKey> =>
  withTransaction(store, 'readwrite', async (tx) => {
    const request = tx.objectStore(store).put(value as IDBValidKey);
    return requestToPromise(request);
  });

export const idbDelete = async (store: StoreName, key: IDBValidKey): Promise<void> =>
  withTransaction(store, 'readwrite', async (tx) => {
    const request = tx.objectStore(store).delete(key);
    await requestToPromise(request);
  });

export const idbDeleteByKeyRange = async (store: StoreName, range: IDBKeyRange): Promise<void> =>
  withTransaction(store, 'readwrite', async (tx) => {
    const request = tx.objectStore(store).delete(range);
    await requestToPromise(request);
  });

export const idbGetAll = async <T>(
  store: StoreName,
  query?: IDBValidKey | IDBKeyRange | null,
  count?: number,
): Promise<T[]> =>
  withTransaction(store, 'readonly', async (tx) => {
    const objectStore = tx.objectStore(store);
    const request = objectStore.getAll(query ?? null, count);
    const list = await requestToPromise(request);
    return list as T[];
  });

export const idbGetAllByIndex = async <T>(
  store: StoreName,
  indexName: string,
  query?: IDBValidKey | IDBKeyRange | null,
  count?: number,
): Promise<T[]> =>
  withTransaction(store, 'readonly', async (tx) => {
    const objectStore = tx.objectStore(store);
    const index = objectStore.index(indexName);
    const request = index.getAll(query ?? null, count);
    const list = await requestToPromise(request);
    return list as T[];
  });

export const browserProjectRange = (
  browserId: string,
  projectId: string,
): IDBKeyRange => IDBKeyRange.bound([browserId, projectId, BROWSER_PROJECT_RANGE_MIN], [browserId, projectId, BROWSER_PROJECT_RANGE_MAX]);

export const browserEntityRange = (browserId: string): IDBKeyRange =>
  IDBKeyRange.bound([browserId, BROWSER_PROJECT_RANGE_MIN], [browserId, BROWSER_PROJECT_RANGE_MAX]);

