import type { ReactNode } from 'react';

export function ProjectGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
      }}
    >
      {children}
    </div>
  );
}

export default ProjectGrid;
