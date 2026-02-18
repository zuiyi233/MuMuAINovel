import { Button, Empty } from 'antd';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No data',
  description = 'There is nothing to display yet.',
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="u-flex-center" style={{ padding: 'var(--space-2xl)' }}>
      <Empty description={<div><div style={{ fontWeight: 600 }}>{title}</div><div>{description}</div></div>}>
        {actionText && onAction ? (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        ) : null}
      </Empty>
    </div>
  );
}

export default EmptyState;
