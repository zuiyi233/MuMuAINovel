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
  const mergedClassName = [
    'macos-surface-card',
    interactive ? 'macos-surface-card--interactive' : '',
    elevated ? 'macos-surface-card--elevated' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // boxShadow 已通过 CSS 类控制，此处仅保留过渡和交互样式
  const surfaceStyle: CSSProperties = {
    transition:
      'transform var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)',
    ...(interactive && { cursor: 'pointer' }),
    ...style,
  };

  return (
    <Card
      className={mergedClassName}
      hoverable={false}
      title={
        title ? (
          <div>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{title}</div>
            {subtitle ? (
              <div className="macos-surface-card__subtitle">{subtitle}</div>
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
