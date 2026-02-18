import type { ReactNode } from 'react';

export interface MetricPillProps {
  label: ReactNode;
  value: ReactNode;
  tone?: 'primary' | 'neutral';
}

export function MetricPill({ label, value, tone = 'neutral' }: MetricPillProps) {
  const color = tone === 'primary' ? 'var(--color-primary)' : 'var(--color-text-primary)';
  const bg = tone === 'primary' ? 'var(--color-info-bg)' : 'var(--color-bg-layout)';

  return (
    <div
      style={{
        padding: 'var(--space-xs) var(--space-sm)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--color-border-light)',
        background: bg,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 'var(--space-xs)',
      }}
    >
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

export default MetricPill;
