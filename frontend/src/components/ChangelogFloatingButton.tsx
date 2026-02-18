import { useState } from 'react';
import { FloatButton, Grid } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import ChangelogModal from './ChangelogModal';

const { useBreakpoint } = Grid;

export default function ChangelogFloatingButton() {
  const [showChangelog, setShowChangelog] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <>
      <FloatButton
        icon={<FileTextOutlined />}
        type="primary"
        tooltip="查看更新日志"
        style={{
          right: isMobile ? 16 : 24,
          bottom: isMobile ? 84 : 100,
          zIndex: 999,
        }}
        onClick={() => setShowChangelog(true)}
      />

      <ChangelogModal visible={showChangelog} onClose={() => setShowChangelog(false)} />
    </>
  );
}
