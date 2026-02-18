import { Tag } from 'antd';
import type { ReactNode } from 'react';

export type StatusIntent = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  intent?: StatusIntent;
  icon?: ReactNode;
  children: ReactNode;
}

const colorMap: Record<StatusIntent, string> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'processing',
};

export function StatusBadge({ intent = 'default', icon, children }: StatusBadgeProps) {
  return (
    <Tag
      icon={icon}
      color={colorMap[intent]}
      style={{
        margin: 0,
        borderRadius: 'var(--radius-sm)',
        paddingInline: 'var(--space-xs)',
        minHeight: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2xs)',
      }}
    >
      {children}
    </Tag>
  );
}

export default StatusBadge;
