import type { Chapter, Character, Foreshadow, Outline, Project } from '../types';
import { getOrCreateBrowserId } from './browserId';
import {
  browserEntityRange,
  browserProjectRange,
  idbDelete,
  idbDeleteByKeyRange,
  idbGet,
  idbGetAllByIndex,
  idbPut,
  isIndexedDbSupported,
  STORE_NAMES,
  type StoreName,
} from './indexedDb';

type BrowserScoped = {
  id: string;
  browser_id: string;
  created_at?: string;
  updated_at?: string;
};

type ProjectScoped = BrowserScoped & {
  project_id: string;
};

type NewProjectScopedInput<T extends ProjectScoped> = Omit<T, 'browser_id' | 'created_at' | 'updated_at'> &
  Partial<Pick<T, 'id'>> & {
    created_at?: string;
    updated_at?: string;
  };

const isBrowser = (): boolean => typeof window !== 'undefined';
const supportsKeyRange = (): boolean => typeof IDBKeyRange !== 'undefined';
const nowIso = (): string => new Date().toISOString();

const browserUpdatedRange = (browserId: string): IDBKeyRange =>
  IDBKeyRange.bound([browserId, ''], [browserId, '\uffff']);

const withBrowserScope = <T extends { id: string }>(
  browserId: string,
  entity: T,
): T & { browser_id: string } => ({
  ...entity,
  browser_id: browserId,
});

const stripBrowserId = <T extends { browser_id?: string }>(entity: T): Omit<T, 'browser_id'> => {
  const { browser_id, ...rest } = entity;
  void browser_id;
  return rest;
};

export const createLocalId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export type LocalProject = Project & { browser_id: string };
export type LocalOutline = Outline & { browser_id: string };
export type LocalChapter = Chapter & { browser_id: string };
export type LocalCharacter = Character & { browser_id: string };

export interface LocalOrganization extends BrowserScoped {
  character_id: string;
  project_id: string;
  parent_org_id?: string | null;
  level?: number | null;
  power_level?: number | null;
  member_count?: number | null;
  location?: string | null;
  motto?: string | null;
  color?: string | null;
}

export interface LocalOrganizationMember extends BrowserScoped {
  organization_id: string;
  character_id: string;
  position: string;
  rank?: number | null;
  status?: string | null;
  joined_at?: string | null;
  left_at?: string | null;
  loyalty?: number | null;
  contribution?: number | null;
  source?: string | null;
  notes?: string | null;
}

export interface LocalRelationship extends BrowserScoped {
  project_id: string;
  character_from_id: string;
  character_to_id: string;
  relationship_type_id?: number | null;
  relationship_name?: string | null;
  intimacy_level?: number | null;
  status?: string | null;
  description?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  source?: string | null;
}

export type LocalForeshadow = Foreshadow & { browser_id: string };

type ProjectScopedWrapper<T extends ProjectScoped> = {
  get: (id: string) => Promise<T | undefined>;
  listByProject: (projectId: string) => Promise<T[]>;
  create: (input: NewProjectScopedInput<T>) => Promise<T>;
  upsert: (input: Omit<T, 'browser_id'>) => Promise<T>;
  update: (id: string, patch: Partial<Omit<T, 'id' | 'browser_id'>>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  replaceProject: (projectId: string, items: Array<Omit<T, 'browser_id'>>) => Promise<void>;
};

const createProjectScopedWrappers = <T extends ProjectScoped>(
  store: StoreName,
  listIndex = 'by_browser_project_updated',
): ProjectScopedWrapper<T> => ({
  get: async (id: string): Promise<T | undefined> => {
    if (!isIndexedDbSupported()) {
      return undefined;
    }
    const browserId = await getOrCreateBrowserId();
    return idbGet<T>(store, [browserId, id]);
  },

  listByProject: async (projectId: string): Promise<T[]> => {
    if (!isIndexedDbSupported() || !supportsKeyRange()) {
      return [];
    }
    const browserId = await getOrCreateBrowserId();
    return idbGetAllByIndex<T>(store, listIndex, browserProjectRange(browserId, projectId));
  },

  create: async (input: NewProjectScopedInput<T>): Promise<T> => {
    const browserId = await getOrCreateBrowserId();
    const createdAt = input.created_at ?? nowIso();
    const updatedAt = nowIso();
    const entity = withBrowserScope(browserId, {
      ...input,
      id: input.id ?? createLocalId(),
      created_at: createdAt,
      updated_at: updatedAt,
    }) as T;
    await idbPut(store, entity);
    return entity;
  },

  upsert: async (input: Omit<T, 'browser_id'>): Promise<T> => {
    const browserId = await getOrCreateBrowserId();
    const existing = await idbGet<T>(store, [browserId, input.id]);
    const entity: T = {
      ...(existing ?? ({} as T)),
      ...(input as T),
      browser_id: browserId,
      created_at: input.created_at ?? existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await idbPut(store, entity);
    return entity;
  },

  update: async (id: string, patch: Partial<Omit<T, 'id' | 'browser_id'>>): Promise<T> => {
    const browserId = await getOrCreateBrowserId();
    const current = await idbGet<T>(store, [browserId, id]);
    if (!current) {
      throw new Error(`Local entity not found: ${store}/${id}`);
    }
    const next: T = {
      ...current,
      ...(patch as T),
      id,
      browser_id: browserId,
      updated_at: nowIso(),
    };
    await idbPut(store, next);
    return next;
  },

  delete: async (id: string): Promise<void> => {
    const browserId = await getOrCreateBrowserId();
    await idbDelete(store, [browserId, id]);
  },

  replaceProject: async (projectId: string, items: Array<Omit<T, 'browser_id'>>): Promise<void> => {
    const existing = await (createProjectScopedWrappers<T>(store, listIndex).listByProject(projectId));
    for (const item of existing) {
      await idbDelete(store, [item.browser_id, item.id]);
    }
    for (const item of items) {
      await createProjectScopedWrappers<T>(store, listIndex).upsert(item);
    }
  },
});

export const localProjects = {
  get: async (id: string): Promise<LocalProject | undefined> => {
    if (!isIndexedDbSupported()) {
      return undefined;
    }
    const browserId = await getOrCreateBrowserId();
    return idbGet<LocalProject>(STORE_NAMES.projects, [browserId, id]);
  },

  listAllByUpdated: async (): Promise<LocalProject[]> => {
    if (!isIndexedDbSupported() || !supportsKeyRange()) {
      return [];
    }
    const browserId = await getOrCreateBrowserId();
    return idbGetAllByIndex<LocalProject>(STORE_NAMES.projects, 'by_browser_updated', browserUpdatedRange(browserId));
  },

  create: async (input: Omit<LocalProject, 'browser_id'> & Partial<Pick<LocalProject, 'id'>>): Promise<LocalProject> => {
    const browserId = await getOrCreateBrowserId();
    const entity: LocalProject = {
      ...input,
      id: input.id ?? createLocalId(),
      browser_id: browserId,
      created_at: input.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await idbPut(STORE_NAMES.projects, entity);
    return entity;
  },

  upsert: async (input: Omit<LocalProject, 'browser_id'>): Promise<LocalProject> => {
    const browserId = await getOrCreateBrowserId();
    const existing = await idbGet<LocalProject>(STORE_NAMES.projects, [browserId, input.id]);
    const entity: LocalProject = {
      ...(existing ?? ({} as LocalProject)),
      ...input,
      browser_id: browserId,
      created_at: input.created_at ?? existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await idbPut(STORE_NAMES.projects, entity);
    return entity;
  },

  update: async (id: string, patch: Partial<Omit<LocalProject, 'id' | 'browser_id'>>): Promise<LocalProject> => {
    const browserId = await getOrCreateBrowserId();
    const current = await idbGet<LocalProject>(STORE_NAMES.projects, [browserId, id]);
    if (!current) {
      throw new Error(`Local project not found: ${id}`);
    }
    const next: LocalProject = {
      ...current,
      ...(patch as LocalProject),
      id,
      browser_id: browserId,
      updated_at: nowIso(),
    };
    await idbPut(STORE_NAMES.projects, next);
    return next;
  },

  delete: async (id: string): Promise<void> => {
    const browserId = await getOrCreateBrowserId();
    await idbDelete(STORE_NAMES.projects, [browserId, id]);
  },

  replaceAll: async (items: Array<Omit<LocalProject, 'browser_id'>>): Promise<void> => {
    if (!isIndexedDbSupported() || !supportsKeyRange()) {
      return;
    }
    const browserId = await getOrCreateBrowserId();
    await idbDeleteByKeyRange(STORE_NAMES.projects, browserEntityRange(browserId));
    for (const item of items) {
      await localProjects.upsert(item);
    }
  },
};

export const localOutlines = createProjectScopedWrappers<LocalOutline>(STORE_NAMES.outlines);
export const localChapters = createProjectScopedWrappers<LocalChapter>(STORE_NAMES.chapters);
export const localCharacters = createProjectScopedWrappers<LocalCharacter>(STORE_NAMES.characters);
export const localOrganizations = createProjectScopedWrappers<LocalOrganization>(STORE_NAMES.organizations);
export const localRelationships = createProjectScopedWrappers<LocalRelationship>(STORE_NAMES.relationships);
export const localForeshadows = createProjectScopedWrappers<LocalForeshadow>(STORE_NAMES.foreshadows);

export const localOrganizationMembers = {
  get: async (id: string): Promise<LocalOrganizationMember | undefined> => {
    if (!isIndexedDbSupported()) {
      return undefined;
    }
    const browserId = await getOrCreateBrowserId();
    return idbGet<LocalOrganizationMember>(STORE_NAMES.organizationMembers, [browserId, id]);
  },

  listByOrganization: async (organizationId: string): Promise<LocalOrganizationMember[]> => {
    if (!isIndexedDbSupported() || !supportsKeyRange()) {
      return [];
    }
    const browserId = await getOrCreateBrowserId();
    const range = IDBKeyRange.bound([browserId, organizationId, -Infinity], [browserId, organizationId, Infinity]);
    return idbGetAllByIndex<LocalOrganizationMember>(STORE_NAMES.organizationMembers, 'by_browser_organization_rank', range);
  },

  upsert: async (input: Omit<LocalOrganizationMember, 'browser_id'>): Promise<LocalOrganizationMember> => {
    const browserId = await getOrCreateBrowserId();
    const existing = await idbGet<LocalOrganizationMember>(STORE_NAMES.organizationMembers, [browserId, input.id]);
    const entity: LocalOrganizationMember = {
      ...(existing ?? ({} as LocalOrganizationMember)),
      ...input,
      browser_id: browserId,
      created_at: input.created_at ?? existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await idbPut(STORE_NAMES.organizationMembers, entity);
    return entity;
  },

  update: async (
    id: string,
    patch: Partial<Omit<LocalOrganizationMember, 'id' | 'browser_id'>>,
  ): Promise<LocalOrganizationMember> => {
    const browserId = await getOrCreateBrowserId();
    const current = await idbGet<LocalOrganizationMember>(STORE_NAMES.organizationMembers, [browserId, id]);
    if (!current) {
      throw new Error(`Local organization member not found: ${id}`);
    }
    const next: LocalOrganizationMember = {
      ...current,
      ...(patch as LocalOrganizationMember),
      id,
      browser_id: browserId,
      updated_at: nowIso(),
    };
    await idbPut(STORE_NAMES.organizationMembers, next);
    return next;
  },

  delete: async (id: string): Promise<void> => {
    const browserId = await getOrCreateBrowserId();
    await idbDelete(STORE_NAMES.organizationMembers, [browserId, id]);
  },

  replaceByOrganization: async (organizationId: string, items: Array<Omit<LocalOrganizationMember, 'browser_id'>>): Promise<void> => {
    const existing = await localOrganizationMembers.listByOrganization(organizationId);
    for (const item of existing) {
      await idbDelete(STORE_NAMES.organizationMembers, [item.browser_id, item.id]);
    }
    for (const item of items) {
      await localOrganizationMembers.upsert(item);
    }
  },
};

export const clearBrowserScopedStore = async (store: StoreName): Promise<void> => {
  if (!isIndexedDbSupported() || !supportsKeyRange()) {
    return;
  }
  const browserId = await getOrCreateBrowserId();
  await idbDeleteByKeyRange(store, browserEntityRange(browserId));
};

export type ShadowProjectBundle = {
  project_id: string;
  projects?: Array<Omit<LocalProject, 'browser_id'>>;
  outlines?: Array<Omit<LocalOutline, 'browser_id'>>;
  chapters?: Array<Omit<LocalChapter, 'browser_id'>>;
  characters?: Array<Omit<LocalCharacter, 'browser_id'>>;
  organizations?: Array<Omit<LocalOrganization, 'browser_id'>>;
  organization_members?: Array<Omit<LocalOrganizationMember, 'browser_id'>>;
  relationships?: Array<Omit<LocalRelationship, 'browser_id'>>;
  foreshadows?: Array<Omit<LocalForeshadow, 'browser_id'>>;
};

export const localShadowDump = {
  projectBundle: async (projectId: string): Promise<ShadowProjectBundle> => {
    if (!isBrowser()) {
      return { project_id: projectId };
    }

    const project = await localProjects.get(projectId);
    const outlines = await localOutlines.listByProject(projectId);
    const chapters = await localChapters.listByProject(projectId);
    const characters = await localCharacters.listByProject(projectId);
    const organizations = await localOrganizations.listByProject(projectId);
    const relationships = await localRelationships.listByProject(projectId);
    const foreshadows = await localForeshadows.listByProject(projectId);

    const organizationMembers: LocalOrganizationMember[] = [];
    for (const organization of organizations) {
      const members = await localOrganizationMembers.listByOrganization(organization.id);
      organizationMembers.push(...members);
    }

    const payload: ShadowProjectBundle = {
      project_id: projectId,
      projects: project ? [stripBrowserId(project)] : [],
      outlines: outlines.map(stripBrowserId),
      chapters: chapters.map(stripBrowserId),
      characters: characters.map(stripBrowserId),
    };

    if (organizations.length > 0) {
      payload.organizations = organizations.map(stripBrowserId);
    }
    if (organizationMembers.length > 0) {
      payload.organization_members = organizationMembers.map(stripBrowserId);
    }
    if (relationships.length > 0) {
      payload.relationships = relationships.map(stripBrowserId);
    }
    if (foreshadows.length > 0) {
      payload.foreshadows = foreshadows.map(stripBrowserId);
    }

    return payload;
  },
};
