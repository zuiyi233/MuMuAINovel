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
        borderRadius: '999px',
        paddingInline: 'var(--space-xs)',
        minHeight: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2xs)',
        border: '0.5px solid rgba(0, 0, 0, 0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      }}
    >
      {children}
    </Tag>
  );
}

export default StatusBadge;
