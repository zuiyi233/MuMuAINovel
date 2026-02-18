import { syncApi } from '../services/api';
import { localShadowDump } from './localDb';

export const syncProjectShadow = async (projectId: string) => {
  const payload = await localShadowDump.projectBundle(projectId);
  return syncApi.syncShadow(payload as unknown as Record<string, unknown>);
};
