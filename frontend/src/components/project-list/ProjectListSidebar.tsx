import type { MenuProps } from 'antd';
import { Menu } from 'antd';

export interface ProjectListSidebarProps {
  items: MenuProps['items'];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function ProjectListSidebar({ items, selectedKey, onSelect }: ProjectListSidebarProps) {
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

export default ProjectListSidebar;
