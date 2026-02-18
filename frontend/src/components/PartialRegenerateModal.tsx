import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Spin,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  EditOutlined,
  LoadingOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { chapterApi } from '../services/api';
import { useStore } from '../store';
import { syncProjectShadow } from '../utils/shadowSync';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface PartialRegenerateModalProps {
  visible: boolean;
  chapterId: string;
  selectedText: string;
  startPosition: number;
  endPosition: number;
  styleId?: number;
  onClose: () => void;
  onApply: (newText: string, startPosition: number, endPosition: number) => void;
}

type LengthMode = 'similar' | 'expand' | 'condense' | 'custom';

const lengthModeDescription: Record<LengthMode, string> = {
  similar: '保持与原文相近的长度。',
  expand: '扩展内容，增加更多细节与描写。',
  condense: '精简内容，保留核心信息。',
  custom: '指定目标字数。',
};

export default function PartialRegenerateModal({
  visible,
  chapterId,
  selectedText,
  startPosition,
  endPosition,
  styleId,
  onClose,
  onApply,
}: PartialRegenerateModalProps) {
  const { currentProject } = useStore();
  const [userInstructions, setUserInstructions] = useState('');
  const [lengthMode, setLengthMode] = useState<LengthMode>('similar');
  const [customWordCount, setCustomWordCount] = useState<number>(selectedText.length);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const generatedTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    setUserInstructions('');
    setLengthMode('similar');
    setCustomWordCount(selectedText.length);
    setIsGenerating(false);
    setGeneratedText('');
    setHasGenerated(false);
    setProgress(0);
    setProgressMessage('');
  }, [selectedText.length, visible]);

  useEffect(() => {
    if (generatedTextRef.current && isGenerating) {
      generatedTextRef.current.scrollTop = generatedTextRef.current.scrollHeight;
    }
  }, [generatedText, isGenerating]);

  const handleGenerate = async () => {
    if (!userInstructions.trim()) {
      message.warning('请输入重写要求');
      return;
    }
    if (!currentProject?.id) {
      message.error('请先选择项目');
      return;
    }

    try {
      await syncProjectShadow(currentProject.id);
    } catch (error) {
      console.error('shadow sync failed:', error);
      message.error('同步失败，请重试');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');
    setHasGenerated(false);
    setProgress(0);
    setProgressMessage('准备生成...');

    try {
      await chapterApi.partialRegenerateStream(
        chapterId,
        {
          selected_text: selectedText,
          start_position: startPosition,
          end_position: endPosition,
          user_instructions: userInstructions,
          context_chars: 500,
          style_id: styleId,
          length_mode: lengthMode,
          target_word_count: lengthMode === 'custom' ? customWordCount : undefined,
        },
        {
          onProgress: (msg, prog) => {
            setProgress(prog);
            setProgressMessage(msg);
          },
          onChunk: (content) => {
            setGeneratedText((prev) => prev + content);
          },
          onResult: () => {
            setProgress(100);
            setProgressMessage('生成完成');
            setHasGenerated(true);
          },
          onError: (error) => {
            console.error('SSE 错误:', error);
            message.error(error || '生成过程中发生错误');
          },
          onComplete: () => {
            setIsGenerating(false);
            setHasGenerated(true);
          },
        },
      );
    } catch (error) {
      console.error('生成失败:', error);
      message.error('生成失败，请重试');
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    if (isGenerating) {
      message.info('正在结束生成请求...');
    }
    onClose();
  };

  const handleAccept = async () => {
    if (!generatedText.trim()) {
      message.warning('没有可应用内容');
      return;
    }

    try {
      await chapterApi.applyPartialRegenerate(chapterId, {
        new_text: generatedText,
        start_position: startPosition,
        end_position: endPosition,
      });

      message.success('已应用重写内容');
      onApply(generatedText, startPosition, endPosition);
      onClose();
    } catch (error) {
      console.error('应用失败:', error);
      message.error('应用失败，请重试');
    }
  };

  const handleRegenerate = () => {
    setGeneratedText('');
    setHasGenerated(false);
    setProgress(0);
    setProgressMessage('');
    void handleGenerate();
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: 'var(--color-primary)' }} />
          <span>AI 局部重写</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={840}
      centered
      maskClosable={!isGenerating}
      closable={!isGenerating}
      keyboard={!isGenerating}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleCancel} disabled={isGenerating}>
            关闭
          </Button>
          {!hasGenerated ? (
            <Button
              type="primary"
              icon={isGenerating ? <LoadingOutlined /> : <ThunderboltOutlined />}
              onClick={() => void handleGenerate()}
              loading={isGenerating}
              disabled={!userInstructions.trim()}
            >
              {isGenerating ? '生成中...' : '开始重写'}
            </Button>
          ) : (
            <>
              <Button icon={<ReloadOutlined />} onClick={handleRegenerate} disabled={isGenerating}>
                重新生成
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleAccept}>
                接受并应用
              </Button>
            </>
          )}
        </Space>
      }
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } }}
    >
      <Card
        size="small"
        title={
          <Space>
            <Text strong>原文内容</Text>
            <Text type="secondary">({selectedText.length} 字)</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { maxHeight: 160, overflowY: 'auto', background: 'var(--color-bg-layout)' } }}
      >
        <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
          {selectedText}
        </Paragraph>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          重写要求 <Text type="danger">*</Text>
        </Text>
        <TextArea
          value={userInstructions}
          onChange={(e) => setUserInstructions(e.target.value)}
          rows={4}
          disabled={isGenerating}
          style={{ resize: 'none' }}
          placeholder={
            '例如：\n- 加强人物心理变化\n- 增强环境氛围\n- 对话更自然\n- 节奏更紧凑\n- 用词更克制'
          }
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          长度控制
        </Text>
        <Radio.Group value={lengthMode} onChange={(e) => setLengthMode(e.target.value)} disabled={isGenerating} buttonStyle="solid">
          <Radio.Button value="similar">保持长度</Radio.Button>
          <Radio.Button value="expand">扩展</Radio.Button>
          <Radio.Button value="condense">精简</Radio.Button>
          <Radio.Button value="custom">自定义</Radio.Button>
        </Radio.Group>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {lengthModeDescription[lengthMode]}
          </Text>
        </div>
        {lengthMode === 'custom' ? (
          <div style={{ marginTop: 12 }}>
            <Space>
              <Text>目标字数：</Text>
              <InputNumber
                value={customWordCount}
                onChange={(v) => setCustomWordCount(v || selectedText.length)}
                min={10}
                max={10000}
                step={50}
                disabled={isGenerating}
                addonAfter="字"
                style={{ width: 160 }}
              />
            </Space>
          </div>
        ) : null}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {isGenerating || hasGenerated ? (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Space>
              <Text strong>重写结果</Text>
              {generatedText ? <Text type="secondary">({generatedText.length} 字)</Text> : null}
            </Space>
            {isGenerating ? (
              <Space>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
                <Text type="secondary">{progressMessage || '生成中...'}</Text>
              </Space>
            ) : null}
          </div>

          {isGenerating ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 4, background: 'var(--color-bg-layout)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
                    transition: 'width var(--motion-duration-base) var(--motion-easing-standard)',
                  }}
                />
              </div>
            </div>
          ) : null}

          <Card
            size="small"
            style={{
              background: generatedText ? 'var(--color-success-bg)' : 'var(--color-bg-layout)',
              borderColor: generatedText ? 'var(--color-success-border)' : 'var(--color-border-light)',
            }}
            styles={{ body: { maxHeight: 260, overflowY: 'auto', minHeight: 100 } }}
          >
            <div ref={generatedTextRef}>
              {generatedText ? (
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {generatedText}
                  {isGenerating ? <span style={{ marginLeft: 2 }}>▌</span> : null}
                </Paragraph>
              ) : (
                <div className="u-flex-center" style={{ minHeight: 80, color: 'var(--color-text-tertiary)' }}>
                  {isGenerating ? '正在生成内容...' : '等待生成...'}
                </div>
              )}
            </div>
          </Card>

          {hasGenerated && generatedText ? (
            <Alert
              style={{ marginTop: 12 }}
              showIcon
              type="success"
              message="生成完成"
              description={
                <span>
                  原文 {selectedText.length} 字，重写后 {generatedText.length} 字。
                </span>
              }
            />
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
