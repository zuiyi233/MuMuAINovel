import {
  localChapters,
  localCharacters,
  localForeshadows,
  localOrganizationMembers,
  localOrganizations,
  localOutlines,
  localProjects,
  localRelationships,
  type LocalChapter,
  type LocalCharacter,
  type LocalForeshadow,
  type LocalOrganization,
  type LocalOrganizationMember,
  type LocalOutline,
  type LocalProject,
  type LocalRelationship,
} from './localDb';

const BACKUP_FORMAT_V2 = 'mumu-local-full-backup';
const BACKUP_FORMAT_V1 = 'mumu-local-backup';
const CURRENT_BACKUP_VERSION = 2 as const;

type BackupVersion = 1 | 2;

type BackupProject = Omit<LocalProject, 'browser_id'>;
type BackupOutline = Omit<LocalOutline, 'browser_id'>;
type BackupChapter = Omit<LocalChapter, 'browser_id'>;
type BackupCharacter = Omit<LocalCharacter, 'browser_id'>;
type BackupOrganization = Omit<LocalOrganization, 'browser_id'>;
type BackupOrganizationMember = Omit<LocalOrganizationMember, 'browser_id'>;
type BackupRelationship = Omit<LocalRelationship, 'browser_id'>;
type BackupForeshadow = Omit<LocalForeshadow, 'browser_id'>;

export type BackupStatistics = {
  projects: number;
  outlines: number;
  chapters: number;
  characters: number;
  organizations: number;
  organization_members: number;
  relationships: number;
  foreshadows: number;
  careers: number;
  character_careers: number;
  writing_styles: number;
  story_memories: number;
  plot_analysis: number;
  generation_history: number;
  has_default_style: boolean;
};

type BackupPayloadV2 = {
  format: string;
  version: 2;
  exported_at: string;
  projects: BackupProject[];
  outlines: BackupOutline[];
  chapters: BackupChapter[];
  characters: BackupCharacter[];
  organizations: BackupOrganization[];
  organization_members: BackupOrganizationMember[];
  relationships: BackupRelationship[];
  foreshadows: BackupForeshadow[];
};

type BackupPayloadV1 = {
  format: string;
  version: 1;
  exported_at?: string;
  projects?: BackupProject[];
  outlines?: BackupOutline[];
  chapters?: BackupChapter[];
  characters?: BackupCharacter[];
};

export type ValidationResult = {
  valid: boolean;
  version: string;
  project_name?: string;
  statistics: BackupStatistics;
  errors: string[];
  warnings: string[];
};

export type ImportResult = {
  success: boolean;
  message: string;
  project_ids: string[];
  statistics: BackupStatistics;
  warnings: string[];
};

const emptyStatistics = (): BackupStatistics => ({
  projects: 0,
  outlines: 0,
  chapters: 0,
  characters: 0,
  organizations: 0,
  organization_members: 0,
  relationships: 0,
  foreshadows: 0,
  careers: 0,
  character_careers: 0,
  writing_styles: 0,
  story_memories: 0,
  plot_analysis: 0,
  generation_history: 0,
  has_default_style: false,
});

const nowIso = (): string => new Date().toISOString();

const readFileText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    throw new Error('Backup payload is not a JSON object');
  }
  return value as Record<string, unknown>;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const stripBrowserId = <T extends { browser_id: string }>(entity: T): Omit<T, 'browser_id'> => {
  const { browser_id: _ignored, ...rest } = entity;
  return rest;
};

const buildFileName = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `mumu_local_backup_v2_${yyyy}${mm}${dd}_${hh}${mi}${ss}.json`;
};

const downloadJson = (payload: unknown, fileName: string): void => {
  if (typeof document === 'undefined') {
    throw new Error('Download is only available in browser environment');
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildStatistics = (payload: BackupPayloadV2): BackupStatistics => ({
  ...emptyStatistics(),
  projects: payload.projects.length,
  outlines: payload.outlines.length,
  chapters: payload.chapters.length,
  characters: payload.characters.length,
  organizations: payload.organizations.length,
  organization_members: payload.organization_members.length,
  relationships: payload.relationships.length,
  foreshadows: payload.foreshadows.length,
});

const normalizePayload = (raw: unknown): { version: BackupVersion; payload: BackupPayloadV2 } => {
  const obj = asRecord(raw);
  const format = obj.format;
  const version = obj.version;

  if (format !== BACKUP_FORMAT_V1 && format !== BACKUP_FORMAT_V2) {
    throw new Error('Unsupported backup format');
  }

  if (version !== 1 && version !== 2) {
    throw new Error('Unsupported backup version');
  }

  if (version === 1) {
    const payloadV1 = obj as BackupPayloadV1;
    return {
      version,
      payload: {
        format: BACKUP_FORMAT_V2,
        version: CURRENT_BACKUP_VERSION,
        exported_at: typeof payloadV1.exported_at === 'string' ? payloadV1.exported_at : nowIso(),
        projects: asArray<BackupProject>(payloadV1.projects),
        outlines: asArray<BackupOutline>(payloadV1.outlines),
        chapters: asArray<BackupChapter>(payloadV1.chapters),
        characters: asArray<BackupCharacter>(payloadV1.characters),
        organizations: [],
        organization_members: [],
        relationships: [],
        foreshadows: [],
      },
    };
  }

  return {
    version,
    payload: {
      format: BACKUP_FORMAT_V2,
      version: CURRENT_BACKUP_VERSION,
      exported_at: typeof obj.exported_at === 'string' ? obj.exported_at : nowIso(),
      projects: asArray<BackupProject>(obj.projects),
      outlines: asArray<BackupOutline>(obj.outlines),
      chapters: asArray<BackupChapter>(obj.chapters),
      characters: asArray<BackupCharacter>(obj.characters),
      organizations: asArray<BackupOrganization>(obj.organizations),
      organization_members: asArray<BackupOrganizationMember>(obj.organization_members),
      relationships: asArray<BackupRelationship>(obj.relationships),
      foreshadows: asArray<BackupForeshadow>(obj.foreshadows),
    },
  };
};

const validatePayload = (payload: BackupPayloadV2): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checkUniqueIds = (name: string, list: Array<{ id?: unknown }>): Set<string> => {
    const ids = new Set<string>();
    list.forEach((item, index) => {
      if (typeof item.id !== 'string' || !item.id) {
        errors.push(`${name}[${index}] missing valid id`);
        return;
      }
      if (ids.has(item.id)) {
        errors.push(`${name}[${index}] duplicate id: ${item.id}`);
      } else {
        ids.add(item.id);
      }
    });
    return ids;
  };

  const projectIds = checkUniqueIds('projects', payload.projects);
  const outlineIds = checkUniqueIds('outlines', payload.outlines);
  const chapterIds = checkUniqueIds('chapters', payload.chapters);
  const characterIds = checkUniqueIds('characters', payload.characters);
  const organizationIds = checkUniqueIds('organizations', payload.organizations);
  checkUniqueIds('organization_members', payload.organization_members);
  checkUniqueIds('relationships', payload.relationships);
  checkUniqueIds('foreshadows', payload.foreshadows);

  payload.outlines.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`outlines/${item.id} references missing project_id ${item.project_id}`);
    }
  });

  payload.chapters.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`chapters/${item.id} references missing project_id ${item.project_id}`);
    }
    if (item.outline_id && !outlineIds.has(item.outline_id)) {
      errors.push(`chapters/${item.id} references missing outline_id ${item.outline_id}`);
    }
  });

  payload.characters.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`characters/${item.id} references missing project_id ${item.project_id}`);
    }
  });

  payload.organizations.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`organizations/${item.id} references missing project_id ${item.project_id}`);
    }
    if (!characterIds.has(item.character_id)) {
      errors.push(`organizations/${item.id} references missing character_id ${item.character_id}`);
    }
    if (item.parent_org_id && !organizationIds.has(item.parent_org_id)) {
      errors.push(`organizations/${item.id} references missing parent_org_id ${item.parent_org_id}`);
    }
  });

  payload.organization_members.forEach((item) => {
    if (!organizationIds.has(item.organization_id)) {
      errors.push(`organization_members/${item.id} references missing organization_id ${item.organization_id}`);
    }
    if (!characterIds.has(item.character_id)) {
      errors.push(`organization_members/${item.id} references missing character_id ${item.character_id}`);
    }
  });

  payload.relationships.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`relationships/${item.id} references missing project_id ${item.project_id}`);
    }
    if (!characterIds.has(item.character_from_id)) {
      errors.push(`relationships/${item.id} references missing character_from_id ${item.character_from_id}`);
    }
    if (!characterIds.has(item.character_to_id)) {
      errors.push(`relationships/${item.id} references missing character_to_id ${item.character_to_id}`);
    }
  });

  payload.foreshadows.forEach((item) => {
    if (!projectIds.has(item.project_id)) {
      errors.push(`foreshadows/${item.id} references missing project_id ${item.project_id}`);
    }
    if (item.plant_chapter_id && !chapterIds.has(item.plant_chapter_id)) {
      errors.push(`foreshadows/${item.id} references missing plant_chapter_id ${item.plant_chapter_id}`);
    }
    if (item.target_resolve_chapter_id && !chapterIds.has(item.target_resolve_chapter_id)) {
      errors.push(
        `foreshadows/${item.id} references missing target_resolve_chapter_id ${item.target_resolve_chapter_id}`,
      );
    }
    if (item.actual_resolve_chapter_id && !chapterIds.has(item.actual_resolve_chapter_id)) {
      errors.push(
        `foreshadows/${item.id} references missing actual_resolve_chapter_id ${item.actual_resolve_chapter_id}`,
      );
    }
  });

  if (payload.projects.length === 0) {
    warnings.push('No projects found in backup payload');
  }

  return { errors, warnings };
};

const parseBackup = async (
  file: File,
): Promise<{
  version: BackupVersion;
  payload: BackupPayloadV2;
  statistics: BackupStatistics;
  errors: string[];
  warnings: string[];
}> => {
  const text = await readFileText(file);
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON backup file');
  }

  const normalized = normalizePayload(raw);
  const statistics = buildStatistics(normalized.payload);
  const { errors, warnings } = validatePayload(normalized.payload);

  return {
    version: normalized.version,
    payload: normalized.payload,
    statistics,
    errors,
    warnings,
  };
};

export const validateLocalBackupFile = async (file: File): Promise<ValidationResult> => {
  try {
    const parsed = await parseBackup(file);
    const firstProject = parsed.payload.projects[0];

    return {
      valid: parsed.errors.length === 0,
      version: `v${parsed.version}`,
      project_name: firstProject?.title,
      statistics: parsed.statistics,
      errors: parsed.errors,
      warnings: parsed.warnings,
    };
  } catch (error) {
    return {
      valid: false,
      version: 'unknown',
      project_name: undefined,
      statistics: emptyStatistics(),
      errors: [error instanceof Error ? error.message : 'Failed to validate backup file'],
      warnings: [],
    };
  }
};

export const exportLocalBackup = async (
  projectIds?: string[],
): Promise<{ filename: string; statistics: BackupStatistics }> => {
  const allProjects = await localProjects.listAllByUpdated();
  const selectedProjects =
    Array.isArray(projectIds) && projectIds.length > 0
      ? allProjects.filter((project) => projectIds.includes(project.id))
      : allProjects;

  if (selectedProjects.length === 0) {
    throw new Error('No projects selected for export');
  }

  const outlines: BackupOutline[] = [];
  const chapters: BackupChapter[] = [];
  const characters: BackupCharacter[] = [];
  const organizations: BackupOrganization[] = [];
  const organizationMembers: BackupOrganizationMember[] = [];
  const relationships: BackupRelationship[] = [];
  const foreshadows: BackupForeshadow[] = [];

  for (const project of selectedProjects) {
    const projectOutlines = await localOutlines.listByProject(project.id);
    const projectChapters = await localChapters.listByProject(project.id);
    const projectCharacters = await localCharacters.listByProject(project.id);
    const projectOrganizations = await localOrganizations.listByProject(project.id);
    const projectRelationships = await localRelationships.listByProject(project.id);
    const projectForeshadows = await localForeshadows.listByProject(project.id);

    outlines.push(...projectOutlines.map(stripBrowserId));
    chapters.push(...projectChapters.map(stripBrowserId));
    characters.push(...projectCharacters.map(stripBrowserId));
    organizations.push(...projectOrganizations.map(stripBrowserId));
    relationships.push(...projectRelationships.map(stripBrowserId));
    foreshadows.push(...projectForeshadows.map(stripBrowserId));

    for (const organization of projectOrganizations) {
      const members = await localOrganizationMembers.listByOrganization(organization.id);
      organizationMembers.push(...members.map(stripBrowserId));
    }
  }

  const payload: BackupPayloadV2 = {
    format: BACKUP_FORMAT_V2,
    version: CURRENT_BACKUP_VERSION,
    exported_at: nowIso(),
    projects: selectedProjects.map(stripBrowserId),
    outlines,
    chapters,
    characters,
    organizations,
    organization_members: organizationMembers,
    relationships,
    foreshadows,
  };

  const fileName = buildFileName();
  downloadJson(payload, fileName);

  return {
    filename: fileName,
    statistics: buildStatistics(payload),
  };
};

export const importLocalBackupReplace = async (file: File): Promise<ImportResult> => {
  const parsed = await parseBackup(file);

  if (parsed.errors.length > 0) {
    return {
      success: false,
      message: `Import blocked: ${parsed.errors.length} validation error(s)`,
      project_ids: [],
      statistics: parsed.statistics,
      warnings: parsed.warnings,
    };
  }

  const importedProjectIds: string[] = [];

  for (const project of parsed.payload.projects) {
    const projectId = project.id;

    const projectOutlines = parsed.payload.outlines.filter((item) => item.project_id === projectId);
    const projectChapters = parsed.payload.chapters.filter((item) => item.project_id === projectId);
    const projectCharacters = parsed.payload.characters.filter((item) => item.project_id === projectId);
    const projectOrganizations = parsed.payload.organizations.filter((item) => item.project_id === projectId);
    const projectRelationships = parsed.payload.relationships.filter((item) => item.project_id === projectId);
    const projectForeshadows = parsed.payload.foreshadows.filter((item) => item.project_id === projectId);

    const organizationIds = new Set(projectOrganizations.map((item) => item.id));
    const projectOrganizationMembers = parsed.payload.organization_members.filter((item) =>
      organizationIds.has(item.organization_id),
    );

    const existingOrganizations = await localOrganizations.listByProject(projectId);
    for (const organization of existingOrganizations) {
      await localOrganizationMembers.replaceByOrganization(organization.id, []);
    }

    await localProjects.upsert(project);
    await localOutlines.replaceProject(projectId, projectOutlines);
    await localChapters.replaceProject(projectId, projectChapters);
    await localCharacters.replaceProject(projectId, projectCharacters);
    await localOrganizations.replaceProject(projectId, projectOrganizations);
    await localRelationships.replaceProject(projectId, projectRelationships);
    await localForeshadows.replaceProject(projectId, projectForeshadows);

    for (const organization of projectOrganizations) {
      const members = projectOrganizationMembers.filter((item) => item.organization_id === organization.id);
      await localOrganizationMembers.replaceByOrganization(organization.id, members);
    }

    importedProjectIds.push(projectId);
  }

  return {
    success: true,
    message: `Import completed: ${importedProjectIds.length} project(s)`,
    project_ids: importedProjectIds,
    statistics: parsed.statistics,
    warnings: parsed.warnings,
  };
};
