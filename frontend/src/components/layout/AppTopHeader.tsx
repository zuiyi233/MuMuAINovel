import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { ReactNode } from 'react';

export interface AppTopHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  metrics?: ReactNode;
  onOpenMobileMenu?: () => void;
  mobile?: boolean;
}

export function AppTopHeader({
  title,
  subtitle,
  leftActions,
  rightActions,
  metrics,
  onOpenMobileMenu,
  mobile = false,
}: AppTopHeaderProps) {
  return (
    <header className="app-shell__header">
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-sm)',
          paddingInline: mobile ? 'var(--space-sm)' : 'var(--space-lg)',
          color: 'var(--color-bg-container)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', minWidth: 0 }}>
          {mobile ? (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={onOpenMobileMenu}
              style={{ color: 'var(--color-bg-container)' }}
            />
          ) : null}
          {leftActions}
          <div style={{ minWidth: 0 }}>
            <div className="u-truncate" style={{ fontSize: mobile ? 'var(--font-size-md)' : 'var(--font-size-xl)', fontWeight: 600 }}>
              {title}
            </div>
            {subtitle ? (
              <div className="u-truncate" style={{ opacity: 0.9, fontSize: 'var(--font-size-sm)' }}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {!mobile ? metrics : null}
          {rightActions}
        </div>
      </div>
    </header>
  );
}

export default AppTopHeader;
