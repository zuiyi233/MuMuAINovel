import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar, Button, Empty, Modal, Space, Spin, Tag, Timeline, Typography } from 'antd';
import {
  BgColorsOutlined,
  BugOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  GithubOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  StarOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  cacheChangelog,
  clearChangelogCache,
  fetchChangelog,
  groupChangelogByDate,
  type ChangelogEntry,
} from '../services/changelogService';

const { Text } = Typography;

interface ChangelogModalProps {
  visible: boolean;
  onClose: () => void;
}

const typeConfig: Record<ChangelogEntry['type'], { icon: ReactNode; color: string; label: string }> = {
  feature: { icon: <StarOutlined />, color: 'green', label: '新功能' },
  update: { icon: <SyncOutlined />, color: 'geekblue', label: '更新' },
  fix: { icon: <BugOutlined />, color: 'red', label: '修复' },
  docs: { icon: <FileTextOutlined />, color: 'blue', label: '文档' },
  style: { icon: <BgColorsOutlined />, color: 'purple', label: '样式' },
  refactor: { icon: <ThunderboltOutlined />, color: 'orange', label: '重构' },
  perf: { icon: <ThunderboltOutlined />, color: 'gold', label: '性能' },
  test: { icon: <ExperimentOutlined />, color: 'cyan', label: '测试' },
  chore: { icon: <ToolOutlined />, color: 'default', label: '杂项' },
  other: { icon: <QuestionCircleOutlined />, color: 'default', label: '其他' },
};

export default function ChangelogModal({ visible, onClose }: ChangelogModalProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadChangelog = async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const entries = await fetchChangelog(pageNum, 30);
      if (entries.length === 0) {
        setHasMore(false);
      } else if (append) {
        setChangelog((prev) => [...prev, ...entries]);
      } else {
        setChangelog(entries);
        if (pageNum === 1) {
          cacheChangelog(entries);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取更新日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    void loadChangelog(1, false);
    setPage(1);
    setHasMore(true);
  }, [visible]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadChangelog(nextPage, true);
  };

  const handleRefresh = () => {
    clearChangelogCache();
    setPage(1);
    setHasMore(true);
    void loadChangelog(1, false);
  };

  const groupedChangelog = useMemo(() => groupChangelogByDate(changelog), [changelog]);
  const sortedDates = useMemo(() => Array.from(groupedChangelog.keys()).sort((a, b) => b.localeCompare(a)), [groupedChangelog]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      title={
        <Space>
          <GithubOutlined />
          <span>更新日志</span>
          <Button type="text" size="small" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} title="刷新" />
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: 'var(--space-lg)' } }}
    >
      {error ? (
        <div
          style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      ) : null}

      {loading && changelog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
          <Spin size="large" tip="加载更新日志中..." />
        </div>
      ) : null}

      {!loading && changelog.length === 0 ? <Empty description="暂无更新日志" /> : null}

      {changelog.length > 0 ? (
        <>
          {sortedDates.map((date) => {
            const entries = groupedChangelog.get(date) || [];
            return (
              <div key={date} style={{ marginBottom: 'var(--space-xl)' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    marginBottom: 'var(--space-md)',
                    paddingBottom: 'var(--space-xs)',
                    borderBottom: '2px solid var(--color-border-secondary)',
                  }}
                >
                  <ClockCircleOutlined style={{ marginRight: 'var(--space-xs)' }} />
                  {formatDate(date)}
                </div>

                <Timeline>
                  {entries.map((entry) => {
                    const config = typeConfig[entry.type] || typeConfig.other;
                    return (
                      <Timeline.Item
                        key={entry.id}
                        dot={
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'var(--color-bg-container)',
                              border: `2px solid ${config.color === 'default' ? 'var(--color-border)' : config.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {config.icon}
                          </div>
                        }
                      >
                        <div style={{ marginLeft: 'var(--space-xs)' }}>
                          <Space size="small" wrap>
                            <Tag color={config.color} icon={config.icon}>
                              {config.label}
                            </Tag>
                            {entry.scope ? <Tag color="blue">{entry.scope}</Tag> : null}
                            <Text style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                              {formatTime(entry.date)}
                            </Text>
                          </Space>

                          <div
                            style={{
                              marginTop: 'var(--space-xs)',
                              lineHeight: 1.6,
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {entry.message}
                          </div>

                          <Space size="small" style={{ marginTop: 'var(--space-xs)' }}>
                            {entry.author.avatar ? <Avatar size="small" src={entry.author.avatar} /> : null}
                            <Text style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                              {entry.author.username || entry.author.name}
                            </Text>
                            <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--font-size-xs)' }}>
                              查看提交
                            </a>
                          </Space>
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </div>
            );
          })}

          {hasMore ? (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
              <Button onClick={handleLoadMore} loading={loading}>
                加载更多
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-md) 0' }}>
              已显示全部更新日志
            </div>
          )}
        </>
      ) : null}

      <div
        style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-info-border)',
          background: 'var(--color-info-bg)',
          color: 'var(--color-primary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        提示：日志数据来自 GitHub 提交记录，打开窗口时会拉取最新内容。
      </div>
    </Modal>
  );
}
