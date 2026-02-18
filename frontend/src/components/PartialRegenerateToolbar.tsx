import { Button, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';

interface PartialRegenerateToolbarProps {
  visible: boolean;
  position: { top: number; left: number };
  onRegenerate: () => void;
  selectedText: string;
}

/**
 * 局部重写浮动工具栏
 */
export function PartialRegenerateToolbar({
  visible,
  position,
  onRegenerate,
  selectedText,
}: PartialRegenerateToolbarProps) {
  if (!visible || !selectedText) return null;

  const displayText = selectedText.length > 20 ? `${selectedText.slice(0, 20)}...` : selectedText;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000,
        background: 'var(--color-bg-container)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-elevated)',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        border: '1px solid var(--color-border-light)',
        transformOrigin: 'top left',
        animation: 'none',
      }}
    >
      <Tooltip title={`AI 重写选中内容: "${displayText}"`} placement="top">
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRegenerate();
          }}
          style={{ fontWeight: 500 }}
        >
          AI 重写
        </Button>
      </Tooltip>

      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)',
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        已选 {selectedText.length} 字
      </span>
    </div>
  );
}

export default PartialRegenerateToolbar;
