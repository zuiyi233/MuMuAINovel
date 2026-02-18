import { Menu } from 'antd';
import type { MenuProps } from 'antd';

export interface ProjectDetailSidebarProps {
  items: MenuProps['items'];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function ProjectDetailSidebar({ items, selectedKey, onSelect }: ProjectDetailSidebarProps) {
  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={items}
      onClick={(e) => onSelect(e.key)}
      style={{ borderRight: 'none', background: 'transparent' }}
    />
  );
}

export default ProjectDetailSidebar;
