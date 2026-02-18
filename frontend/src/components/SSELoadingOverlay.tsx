import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface SSELoadingOverlayProps {
  loading: boolean;
  progress: number;
  message: string;
}

export function SSELoadingOverlay({ loading, progress, message }: SSELoadingOverlayProps) {
  if (!loading) return null;

  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg-mask)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: 'var(--space-md)',
      }}
    >
      <div
        style={{
          width: 'min(620px, 100%)',
          background: 'var(--color-bg-container)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 42, color: 'var(--color-primary)' }} spin />} />
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginTop: 'var(--space-sm)' }}>AI 生成中...</div>
        </div>

        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div
            style={{
              height: 12,
              background: 'var(--color-bg-layout)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
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
                transition: 'width var(--motion-duration-base) var(--motion-easing-standard)',
              }}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-sm)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: safeProgress >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
            }}
          >
            {safeProgress}%
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            minHeight: 24,
          }}
        >
          {message || '准备生成中...'}
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          请勿关闭页面，生成过程可能需要一定时间。
        </div>
      </div>
    </div>
  );
}

export default SSELoadingOverlay;
