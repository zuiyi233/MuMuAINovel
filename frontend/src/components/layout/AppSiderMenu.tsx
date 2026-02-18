import { Drawer, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

const { Sider } = Layout;

export interface AppSiderMenuProps {
  mobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  menuItems: MenuProps['items'];
  selectedKeys: string[];
  onSelect: (key: string) => void;
  width?: number;
  collapsedWidth?: number;
  collapsed?: boolean;
  brand?: ReactNode;
  footer?: ReactNode;
}

function MenuBody({ menuItems, selectedKeys, onSelect }: Pick<AppSiderMenuProps, 'menuItems' | 'selectedKeys' | 'onSelect'>) {
  return (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      items={menuItems}
      onClick={(e) => onSelect(e.key)}
      style={{ borderRight: 'none', background: 'transparent', paddingTop: 'var(--space-sm)' }}
    />
  );
}

export function AppSiderMenu({
  mobile,
  mobileOpen,
  onMobileOpenChange,
  menuItems,
  selectedKeys,
  onSelect,
  width = 220,
  collapsedWidth = 64,
  collapsed = false,
  brand,
  footer,
}: AppSiderMenuProps) {
  if (mobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={() => onMobileOpenChange(false)}
        placement="left"
        width={Math.min(width, 280)}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        title={brand}
      >
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MenuBody
            menuItems={menuItems}
            selectedKeys={selectedKeys}
            onSelect={(key) => {
              onSelect(key);
              onMobileOpenChange(false);
            }}
          />
        </div>
        {footer ? <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--color-border-light)' }}>{footer}</div> : null}
      </Drawer>
    );
  }

  return (
    <Sider
      className={`app-shell__sider ${collapsed ? 'app-shell__sider--collapsed' : ''} modern-sider`}
      width={width}
      collapsedWidth={collapsedWidth}
      collapsed={collapsed}
      trigger={null}
      style={{ borderRight: '1px solid var(--color-border-light)' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {brand ? <div style={{ padding: 'var(--space-sm) var(--space-md)' }}>{brand}</div> : null}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MenuBody menuItems={menuItems} selectedKeys={selectedKeys} onSelect={onSelect} />
        </div>
        {footer ? <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--color-border-light)' }}>{footer}</div> : null}
      </div>
    </Sider>
  );
}

export default AppSiderMenu;
