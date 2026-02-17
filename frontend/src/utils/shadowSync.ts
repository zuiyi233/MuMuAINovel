import api from '../services/api';

export const syncProjectShadow = async (projectId: string) => {
  return api.post('/sync/shadow', { project_id: projectId });
};
