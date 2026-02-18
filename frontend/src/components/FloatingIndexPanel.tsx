import { useMemo, useState } from 'react';
import { Drawer, Empty, Input, List, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Chapter } from '../types';

const { Link, Text } = Typography;

interface GroupedChapters {
  outlineId: string | null;
  outlineTitle: string;
  chapters: Chapter[];
}

interface FloatingIndexPanelProps {
  visible: boolean;
  onClose: () => void;
  groupedChapters: GroupedChapters[];
  onChapterSelect: (chapterId: string) => void;
}

export default function FloatingIndexPanel({
  visible,
  onClose,
  groupedChapters,
  onChapterSelect,
}: FloatingIndexPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedChapters;
    const keyword = searchTerm.toLowerCase();
    return groupedChapters
      .map((group) => ({
        ...group,
        chapters: group.chapters.filter((chapter) => chapter.title.toLowerCase().includes(keyword)),
      }))
      .filter((group) => group.chapters.length > 0);
  }, [groupedChapters, searchTerm]);

  const handleChapterClick = (chapterId: string) => {
    onChapterSelect(chapterId);
    onClose();
  };

  return (
    <Drawer
      title="章节目录"
      placement="right"
      onClose={onClose}
      open={visible}
      width={340}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      <div
        style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-bg-container)',
        }}
      >
        <Input
          placeholder="搜索章节标题"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      {filteredGroups.length ? (
        <List
          dataSource={filteredGroups}
          renderItem={(group) => (
            <List.Item style={{ padding: '0 var(--space-md)', display: 'block' }}>
              <div style={{ padding: 'var(--space-sm) 0 var(--space-xs)' }}>
                <Tag color={group.outlineId ? 'blue' : 'default'} style={{ margin: 0 }}>
                  {group.outlineTitle}
                </Tag>
              </div>
              <List
                size="small"
                split={false}
                dataSource={group.chapters}
                renderItem={(chapter) => (
                  <List.Item style={{ padding: '4px 0 6px var(--space-md)' }}>
                    <Link onClick={() => handleChapterClick(chapter.id)}>
                      第 {chapter.chapter_number} 章 · {chapter.title}
                    </Link>
                  </List.Item>
                )}
              />
            </List.Item>
          )}
          style={{ flex: 1, overflowY: 'auto' }}
        />
      ) : (
        <div className="u-flex-center" style={{ flex: 1, padding: 'var(--space-2xl)' }}>
          <Empty description={<Text type="secondary">未找到匹配章节</Text>} />
        </div>
      )}
    </Drawer>
  );
}
