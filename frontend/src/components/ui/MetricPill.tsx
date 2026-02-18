import type { ReactNode } from 'react';

export interface MetricPillProps {
  label: ReactNode;
  value: ReactNode;
  tone?: 'primary' | 'neutral';
}

export function MetricPill({ label, value, tone = 'neutral' }: MetricPillProps) {
  const isPrimary = tone === 'primary';

  return (
    <div
      className={[
        'macos-metric-pill',
        isPrimary ? 'macos-metric-pill--primary' : 'macos-metric-pill--neutral',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="macos-metric-pill__label">{label}</span>
      <span className="macos-metric-pill__value">{value}</span>
    </div>
  );
}

export default MetricPill;
