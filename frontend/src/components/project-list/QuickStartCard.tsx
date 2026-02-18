import { Button, Space } from 'antd';
import { RocketOutlined, BulbOutlined } from '@ant-design/icons';
import { SurfaceCard } from '../ui';

export interface QuickStartCardProps {
  onStart: () => void;
  onInspiration: () => void;
}

export function QuickStartCard({ onStart, onInspiration }: QuickStartCardProps) {
  return (
    <SurfaceCard elevated interactive>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button type="primary" icon={<RocketOutlined />} block onClick={onStart}>
          快速开始
        </Button>
        <Button icon={<BulbOutlined />} block onClick={onInspiration}>
          灵感模式
        </Button>
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
          开始一个新的创作旅程
        </div>
      </Space>
    </SurfaceCard>
  );
}

export default QuickStartCard;
