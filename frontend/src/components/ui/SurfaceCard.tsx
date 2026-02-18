import { Card } from 'antd';
import type { CardProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

export interface SurfaceCardProps extends Omit<CardProps, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  interactive?: boolean;
  elevated?: boolean;
}

export function SurfaceCard({
  title,
  subtitle,
  interactive = false,
  elevated = false,
  className,
  style,
  children,
  ...rest
}: SurfaceCardProps) {
  const mergedClassName = ['macos-surface-card', interactive ? 'macos-surface-card--interactive' : '', className]
    .filter(Boolean)
    .join(' ');

  const surfaceStyle: CSSProperties = {
    borderRadius: 'calc(var(--radius-lg) + 2px)',
    boxShadow: elevated ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
    transition:
      'transform var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)',
    ...(interactive && { cursor: 'pointer' }),
    ...style,
  };

  return (
    <Card
      className={mergedClassName}
      hoverable={interactive}
      title={
        title ? (
          <div>
            <div style={{ color: 'var(--color-text-primary)' }}>{title}</div>
            {subtitle ? (
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{subtitle}</div>
            ) : null}
          </div>
        ) : undefined
      }
      style={surfaceStyle}
      {...rest}
    >
      {children}
    </Card>
  );
}

export default SurfaceCard;
