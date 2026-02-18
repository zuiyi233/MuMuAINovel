import { Alert, Button } from 'antd';
import type { ReactNode } from 'react';

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  retryText?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please retry or check your network connection.',
  retryText = 'Retry',
  onRetry,
}: ErrorStateProps) {
  return (
    <div style={{ padding: 'var(--space-lg)' }}>
      <Alert
        type="error"
        message={title}
        description={
          <div>
            <div>{description}</div>
            {onRetry ? (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <Button onClick={onRetry}>{retryText}</Button>
              </div>
            ) : null}
          </div>
        }
        showIcon
      />
    </div>
  );
}

export default ErrorState;
