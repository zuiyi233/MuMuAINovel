import type { ReactNode } from 'react';
import { PageHeader } from '../ui';

export interface ProjectDetailHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
}

export function ProjectDetailHeader({ title, subtitle, actions, metrics }: ProjectDetailHeaderProps) {
  return <PageHeader title={title} subtitle={subtitle} actions={actions} metrics={metrics} />;
}

export default ProjectDetailHeader;
