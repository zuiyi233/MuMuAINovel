import type { ReactNode } from 'react';

export interface SectionBlockProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionBlock({ title, description, actions, children }: SectionBlockProps) {
  return (
    <section
      style={{
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-container)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {(title || actions || description) && (
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border-light)' }}>
          <div className="u-flex-between" style={{ gap: 'var(--space-sm)' }}>
            <div>
              {title ? (
                <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>{title}</h2>
              ) : null}
              {description ? (
                <p style={{ margin: 'var(--space-xs) 0 0', color: 'var(--color-text-secondary)' }}>{description}</p>
              ) : null}
            </div>
            {actions ? <div>{actions}</div> : null}
          </div>
        </div>
      )}
      <div style={{ padding: 'var(--space-md)' }}>{children}</div>
    </section>
  );
}

export default SectionBlock;
