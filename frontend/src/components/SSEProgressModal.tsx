import { Button, Modal, Spin } from 'antd';
import { LoadingOutlined, StopOutlined } from '@ant-design/icons';

interface SSEProgressModalProps {
  visible: boolean;
  progress: number;
  message: string;
  title?: string;
  showPercentage?: boolean;
  showIcon?: boolean;
  onCancel?: () => void;
  cancelButtonText?: string;
}

export function SSEProgressModal({
  visible,
  progress,
  message,
  title = 'AI 生成中...',
  showPercentage = true,
  showIcon = true,
  onCancel,
  cancelButtonText = '取消任务',
}: SSEProgressModalProps) {
  if (!visible) return null;

  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <Modal
      title={null}
      open={visible}
      footer={null}
      closable={false}
      centered
      width={520}
      maskClosable={false}
      keyboard={false}
      styles={{ body: { padding: 'var(--space-xl)' } }}
    >
      <div>
        {showIcon ? (
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: 'var(--color-primary)' }} spin />} />
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                marginTop: 'var(--space-sm)',
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </div>
          </div>
        ) : null}

        <div style={{ marginBottom: showPercentage ? 'var(--space-md)' : 'var(--space-lg)' }}>
          <div
            style={{
              height: 12,
              background: 'var(--color-bg-layout)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginBottom: showPercentage ? 'var(--space-sm)' : 0,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${safeProgress}%`,
                background:
                  safeProgress >= 100
                    ? 'linear-gradient(90deg, var(--color-success), var(--color-success-active))'
                    : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
                borderRadius: 'var(--radius-pill)',
                transition: 'width var(--motion-duration-base) var(--motion-easing-standard)',
              }}
            />
          </div>

          {showPercentage ? (
            <div
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 700,
                color: safeProgress >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            >
              {safeProgress}%
            </div>
          ) : null}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            minHeight: 24,
            marginBottom: 'var(--space-sm)',
          }}
        >
          {message || '准备生成中...'}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
            marginBottom: onCancel ? 'var(--space-sm)' : 0,
          }}
        >
          请勿关闭页面，生成过程可能需要一定时间。
        </div>

        {onCancel ? (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            <Button danger icon={<StopOutlined />} onClick={onCancel}>
              {cancelButtonText}
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default SSEProgressModal;
