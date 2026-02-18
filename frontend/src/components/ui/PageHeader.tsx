import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ title, subtitle, actions, metrics, compact = false }: PageHeaderProps) {
  const spacing = compact ? 'var(--space-sm)' : 'var(--space-lg)';

  return (
    <header
      className="macos-page-header"
      style={{
        marginBottom: 'var(--space-md)',
        padding: spacing,
        borderRadius: 'calc(var(--radius-lg) + 2px)',
      }}
    >
      <div className="u-flex-between" style={{ gap: 'var(--space-md)' }}>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xl)',
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: 'var(--space-xs) 0 0', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>{actions}</div> : null}
      </div>
      {metrics ? (
        <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>{metrics}</div>
      ) : null}
    </header>
  );
}

export default PageHeader;
