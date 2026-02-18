interface SSEProgressBarProps {
  loading: boolean;
  progress: number;
  message: string;
}

export function SSEProgressBar({ loading, progress, message }: SSEProgressBarProps) {
  if (!loading) return null;

  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      <div
        style={{
          height: 8,
          background: 'var(--color-bg-layout)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${safeProgress}%`,
            background: safeProgress >= 100 ? 'var(--color-success)' : 'var(--color-info)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width var(--motion-duration-base) var(--motion-easing-standard)',
          }}
        />
      </div>

      <div className="u-flex-between" style={{ fontSize: 'var(--font-size-sm)' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{message || '准备生成中...'}</span>
        <span style={{ fontWeight: 700, color: safeProgress >= 100 ? 'var(--color-success)' : 'var(--color-info)' }}>
          {safeProgress}%
        </span>
      </div>
    </div>
  );
}

export default SSEProgressBar;
