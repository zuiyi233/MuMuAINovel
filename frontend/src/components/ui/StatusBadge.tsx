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
      className="macos-status-badge"
    >
      {children}
    </Tag>
  );
}

export default StatusBadge;
