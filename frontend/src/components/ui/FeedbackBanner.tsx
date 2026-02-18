import { Alert } from 'antd';
import type { ReactNode } from 'react';

export interface FeedbackBannerProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: ReactNode;
  description?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export function FeedbackBanner({ type, title, description, closable, onClose }: FeedbackBannerProps) {
  return (
    <Alert
      type={type}
      message={title}
      description={description}
      showIcon
      closable={closable}
      onClose={onClose}
      style={{
        borderRadius: 'var(--radius-md)',
      }}
    />
  );
}

export default FeedbackBanner;
