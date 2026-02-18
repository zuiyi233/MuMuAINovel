import type { ReactNode } from 'react';

export interface ActionBarProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function ActionBar({ left, right }: ActionBarProps) {
  return (
    <div
      className="u-flex-between"
      style={{
        padding: 'var(--space-sm) var(--space-md)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-container)',
        gap: 'var(--space-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>{right}</div>
    </div>
  );
}

export default ActionBar;
