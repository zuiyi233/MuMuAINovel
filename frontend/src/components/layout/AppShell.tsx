import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { Layout } from 'antd';
import { AppSiderMenu } from './AppSiderMenu';
import { AppTopHeader } from './AppTopHeader';

const { Content } = Layout;

export interface AppShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  menuItems?: MenuProps['items'];
  selectedMenuKey?: string;
  onMenuSelect?: (key: string) => void;
  sidebarWidth?: number;
  collapsedWidth?: number;
  initialCollapsed?: boolean;
  leftHeaderActions?: ReactNode;
  rightHeaderActions?: ReactNode;
  headerMetrics?: ReactNode;
  siderBrand?: ReactNode;
  siderFooter?: ReactNode;
  footer?: ReactNode;
  contentPadding?: string;
  children: ReactNode;
}

const detectMobile = (): boolean => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

export function AppShell({
  title,
  subtitle,
  menuItems = [],
  selectedMenuKey,
  onMenuSelect,
  sidebarWidth = 220,
  collapsedWidth = 64,
  initialCollapsed = false,
  leftHeaderActions,
  rightHeaderActions,
  headerMetrics,
  siderBrand,
  siderFooter,
  footer,
  contentPadding = 'var(--space-lg)',
  children,
}: AppShellProps) {
  const [mobile, setMobile] = useState(detectMobile());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    const onResize = () => setMobile(detectMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const selectedKeys = useMemo(
    () => (selectedMenuKey ? [selectedMenuKey] : []),
    [selectedMenuKey],
  );

  return (
    <Layout className="app-shell">
      <AppTopHeader
        title={title}
        subtitle={subtitle}
        leftActions={leftHeaderActions}
        rightActions={rightHeaderActions}
        metrics={headerMetrics}
        mobile={mobile}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />
      <Layout className="app-shell__body">
        {menuItems.length > 0 ? (
          <AppSiderMenu
            mobile={mobile}
            mobileOpen={mobileMenuOpen}
            onMobileOpenChange={setMobileMenuOpen}
            menuItems={menuItems}
            selectedKeys={selectedKeys}
            onSelect={(key) => onMenuSelect?.(key)}
            width={sidebarWidth}
            collapsedWidth={collapsedWidth}
            collapsed={collapsed}
            brand={siderBrand}
            footer={siderFooter}
          />
        ) : null}
        <Layout>
          <Content
            className="app-shell__content"
            style={{
              padding: contentPadding,
            }}
          >
            <div className="app-shell__surface">{children}</div>
          </Content>
          {footer ? <div style={{ borderTop: '1px solid var(--color-border-light)' }}>{footer}</div> : null}
        </Layout>
      </Layout>
      {!mobile && menuItems.length > 0 ? (
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((v) => !v)}
          style={{
            position: 'fixed',
            top: 'calc(var(--app-header-height) + var(--space-sm))',
            left: collapsed ? `calc(${collapsedWidth}px - 14px)` : `calc(${sidebarWidth}px - 14px)`,
            zIndex: 1200,
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-bg-container)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          {collapsed ? '>' : '<'}
        </button>
      ) : null}
    </Layout>
  );
}

export default AppShell;
