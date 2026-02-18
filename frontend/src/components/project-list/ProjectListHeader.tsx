import type { ReactNode } from 'react';
import { PageHeader } from '../ui';

export interface ProjectListHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
}

export function ProjectListHeader({ title, subtitle, actions, metrics }: ProjectListHeaderProps) {
  return <PageHeader title={title} subtitle={subtitle} actions={actions} metrics={metrics} />;
}

export default ProjectListHeader;
