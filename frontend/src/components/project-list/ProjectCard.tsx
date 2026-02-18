import { SurfaceCard } from '../ui';
import type { SurfaceCardProps } from '../ui';

export type ProjectCardProps = SurfaceCardProps;

export function ProjectCard(props: ProjectCardProps) {
  return <SurfaceCard interactive elevated {...props} />;
}

export default ProjectCard;
