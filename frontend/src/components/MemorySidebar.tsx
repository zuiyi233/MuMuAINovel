import { useEffect, useMemo, useRef } from 'react';
import { Badge, Card, Collapse, Empty, Space, Tag, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import {
  FireOutlined,
  StarOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MemoryAnnotation } from './AnnotatedText';

const { Text } = Typography;

interface MemorySidebarProps {
  annotations: MemoryAnnotation[];
  activeAnnotationId?: string;
  onAnnotationClick?: (annotation: MemoryAnnotation) => void;
  scrollToAnnotation?: string;
}

type AnnotationType = MemoryAnnotation['type'];

type AnnotationTypeConfig = {
  label: string;
  icon: JSX.Element;
  color: string;
  tagColor: string;
};

const TYPE_CONFIG: Record<AnnotationType, AnnotationTypeConfig> = {
  hook: {
    label: '钩子',
    icon: <FireOutlined />,
    color: 'var(--color-error)',
    tagColor: 'red',
  },
  foreshadow: {
    label: '伏笔',
    icon: <StarOutlined />,
    color: 'var(--color-info)',
    tagColor: 'blue',
  },
  plot_point: {
    label: '情节点',
    icon: <ThunderboltOutlined />,
    color: 'var(--color-success)',
    tagColor: 'green',
  },
  character_event: {
    label: '角色事件',
    icon: <UserOutlined />,
    color: 'var(--color-warning)',
    tagColor: 'gold',
  },
};

const TYPE_ORDER: AnnotationType[] = ['hook', 'foreshadow', 'plot_point', 'character_event'];

const normalizeImportance = (importance: number): number => {
  if (!Number.isFinite(importance)) return 0;
  return Math.max(0, Math.min(10, importance * 10));
};

const getPreview = (content: string): string => {
  const text = content.trim();
  if (!text) return '无内容';
  return text.length > 100 ? `${text.slice(0, 100)}...` : text;
};

const getForeshadowTag = (value?: string) => {
  if (value === 'planted') return { color: 'blue', label: '已埋入' };
  if (value === 'resolved') return { color: 'green', label: '已回收' };
  return null;
};

const MemorySidebar = ({
  annotations,
  activeAnnotationId,
  onAnnotationClick,
  scrollToAnnotation,
}: MemorySidebarProps) => {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!scrollToAnnotation) return;
    const target = cardRefs.current[scrollToAnnotation];
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollToAnnotation]);

  const groupedAnnotations = useMemo(() => {
    const groups: Record<AnnotationType, MemoryAnnotation[]> = {
      hook: [],
      foreshadow: [],
      plot_point: [],
      character_event: [],
    };

    annotations.forEach((annotation) => {
      groups[annotation.type].push(annotation);
    });

    TYPE_ORDER.forEach((type) => {
      groups[type].sort((a, b) => b.importance - a.importance);
    });

    return groups;
  }, [annotations]);

  const collapseItems = useMemo<NonNullable<CollapseProps['items']>>(() => {
    const items: NonNullable<CollapseProps['items']> = [];

    TYPE_ORDER.forEach((type) => {
      const groupItems = groupedAnnotations[type];
      if (!groupItems.length) return;
      const config = TYPE_CONFIG[type];

      items.push({
        key: type,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', fontWeight: 600 }}>
            <span style={{ color: config.color, display: 'inline-flex', alignItems: 'center' }}>
              {config.icon}
            </span>
            <span>
              {config.label} ({groupItems.length})
            </span>
          </span>
        ),
        children: (
          <div style={{ marginTop: 'var(--space-xs)' }}>
            {groupItems.map((annotation) => {
              const currentConfig = TYPE_CONFIG[annotation.type];
              const isActive = annotation.id === activeAnnotationId;
              const importance = normalizeImportance(annotation.importance);
              const foreshadowTag = getForeshadowTag(annotation.metadata.foreshadowType);

              return (
                <div
                  key={annotation.id}
                  ref={(node) => {
                    cardRefs.current[annotation.id] = node;
                  }}
                >
                  <Card
                    size="small"
                    hoverable
                    onClick={() => onAnnotationClick?.(annotation)}
                    styles={{ body: { padding: 'var(--space-sm)' } }}
                    style={{
                      marginBottom: 'var(--space-sm)',
                      borderLeft: `4px solid ${currentConfig.color}`,
                      borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-light)',
                      background: isActive ? 'var(--color-info-bg)' : 'var(--color-bg-container)',
                      transition:
                        'transform var(--motion-duration-fast) var(--motion-easing-standard), background var(--motion-duration-fast) var(--motion-easing-standard)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 'var(--space-sm)',
                      }}
                    >
                      <Space size="small" style={{ alignItems: 'flex-start', minWidth: 0 }}>
                        <span style={{ color: currentConfig.color, marginTop: 2 }}>{currentConfig.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="u-truncate" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {annotation.title}
                          </div>
                          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                            重要度 {importance.toFixed(1)}
                          </Text>
                        </div>
                      </Space>

                      <Badge count={importance.toFixed(1)} style={{ background: currentConfig.color }} />
                    </div>

                    <div
                      style={{
                        marginTop: 'var(--space-xs)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-xs)',
                        lineHeight: 1.6,
                      }}
                    >
                      {getPreview(annotation.content)}
                    </div>

                    <Space size={[4, 4]} wrap style={{ marginTop: 'var(--space-xs)' }}>
                      {annotation.tags.map((tag, index) => (
                        <Tag key={`${tag}-${index}`} style={{ margin: 0 }}>
                          {tag}
                        </Tag>
                      ))}
                      {typeof annotation.metadata.strength === 'number' ? (
                        <Tag color={currentConfig.tagColor} style={{ margin: 0 }}>
                          强度 {annotation.metadata.strength}/10
                        </Tag>
                      ) : null}
                      {foreshadowTag ? (
                        <Tag color={foreshadowTag.color} style={{ margin: 0 }}>
                          {foreshadowTag.label}
                        </Tag>
                      ) : null}
                    </Space>
                  </Card>
                </div>
              );
            })}
          </div>
        ),
      });
    });

    return items;
  }, [activeAnnotationId, groupedAnnotations, onAnnotationClick]);

  if (!annotations.length) {
    return (
      <div style={{ padding: 'var(--space-md)' }}>
        <Empty description="暂无可展示的记忆标注" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 'var(--space-sm)' }}>
      <Card
        size="small"
        style={{
          marginBottom: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          borderColor: 'var(--color-border-light)',
          background: 'var(--color-bg-layout)',
        }}
        styles={{ body: { padding: 'var(--space-sm)' } }}
      >
        <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--color-text-primary)' }}>
          分析概览
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
          {TYPE_ORDER.map((type) => {
            const config = TYPE_CONFIG[type];
            const count = groupedAnnotations[type].length;
            return (
              <div key={type}>
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {config.label}
                </Text>
                <div style={{ color: config.color, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Collapse
        ghost
        defaultActiveKey={['hook', 'foreshadow', 'plot_point']}
        items={collapseItems}
      />
    </div>
  );
};

export default MemorySidebar;
