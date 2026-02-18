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

const TRAFFIC_LIGHTS = [
  { key: 'close', className: 'app-shell__traffic-light--close', symbol: 'x' },
  { key: 'minimize', className: 'app-shell__traffic-light--minimize', symbol: '-' },
  { key: 'zoom', className: 'app-shell__traffic-light--zoom', symbol: '+' },
] as const;

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
      <div className="app-shell__header-inner">
        <div className="app-shell__header-title-group">
          {!mobile ? (
            <div className="app-shell__window-controls" aria-hidden>
              {TRAFFIC_LIGHTS.map((light) => (
                <span
                  key={light.key}
                  className={`app-shell__traffic-light ${light.className}`}
                  data-symbol={light.symbol}
                />
              ))}
            </div>
          ) : null}
          {mobile ? (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              className="app-shell__header-button"
              onClick={onOpenMobileMenu}
            />
          ) : null}
          {leftActions}
          <div className="app-shell__titles">
            <h1 className="u-truncate app-shell__title">
              {title}
            </h1>
            {subtitle ? (
              <div className="u-truncate app-shell__subtitle">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="app-shell__header-right">
          {!mobile ? metrics : null}
          {rightActions}
        </div>
      </div>
    </header>
  );
}

export default AppTopHeader;
