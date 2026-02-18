import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Tag,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { ssePost } from '../utils/sseClient';
import { SSEProgressModal } from './SSEProgressModal';
import { useStore } from '../store';
import { syncProjectShadow } from '../utils/shadowSync';

const { TextArea } = Input;

interface Suggestion {
  category: string;
  content: string;
  priority: string;
}

interface ChapterRegenerationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (newContent: string, wordCount: number) => void;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  suggestions?: Suggestion[];
  hasAnalysis: boolean;
}

type ModificationSource = 'custom' | 'analysis_suggestions' | 'mixed';

interface RegenerationRequest {
  modification_source: string;
  custom_instructions?: string;
  selected_suggestion_indices: number[];
  preserve_elements: {
    preserve_structure: boolean;
    preserve_dialogues: string[];
    preserve_plot_points: string[];
    preserve_character_traits: boolean;
  };
  style_id?: string;
  target_word_count: number;
  focus_areas: string[];
}

export default function ChapterRegenerationModal({
  visible,
  onCancel,
  onSuccess,
  chapterId,
  chapterTitle,
  chapterNumber,
  suggestions = [],
  hasAnalysis,
}: ChapterRegenerationModalProps) {
  const { currentProject } = useStore();
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const [modificationSource, setModificationSource] = useState<ModificationSource>('custom');

  useEffect(() => {
    if (!visible) return;
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setWordCount(0);
    setSelectedSuggestions([]);

    const defaultSource: ModificationSource =
      hasAnalysis && suggestions.length > 0 ? 'mixed' : 'custom';
    setModificationSource(defaultSource);
    form.setFieldsValue({
      modification_source: defaultSource,
      target_word_count: 3000,
      preserve_structure: false,
      preserve_character_traits: true,
      focus_areas: [],
    });
  }, [form, hasAnalysis, suggestions.length, visible]);

  const validateInputs = async () => {
    const values = await form.validateFields();
    const customInstructions = values.custom_instructions?.trim();

    if (values.modification_source === 'custom' && !customInstructions) {
      message.error('请输入自定义修改要求');
      return null;
    }
    if (values.modification_source === 'analysis_suggestions' && selectedSuggestions.length === 0) {
      message.error('请至少选择一条分析建议');
      return null;
    }
    if (values.modification_source === 'mixed' && selectedSuggestions.length === 0 && !customInstructions) {
      message.error('请至少选择建议或输入自定义要求');
      return null;
    }
    return values;
  };

  const handleSubmit = async () => {
    try {
      const values = await validateInputs();
      if (!values) return;

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

      setLoading(true);
      setStatus('generating');
      setProgress(0);
      setWordCount(0);

      const requestData: RegenerationRequest = {
        modification_source: values.modification_source,
        custom_instructions: values.custom_instructions,
        selected_suggestion_indices: selectedSuggestions,
        preserve_elements: {
          preserve_structure: values.preserve_structure,
          preserve_dialogues: values.preserve_dialogues || [],
          preserve_plot_points: values.preserve_plot_points || [],
          preserve_character_traits: values.preserve_character_traits,
        },
        style_id: values.style_id,
        target_word_count: values.target_word_count,
        focus_areas: values.focus_areas || [],
      };

      let accumulatedContent = '';
      let currentWordCount = 0;

      await ssePost(`/api/chapters/${chapterId}/regenerate-stream`, requestData, {
        onProgress: (_msg: string, prog: number, _status: string, incomingWordCount?: number) => {
          setProgress(prog);
          if (incomingWordCount !== undefined) {
            setWordCount(incomingWordCount);
            currentWordCount = incomingWordCount;
          }
        },
        onChunk: (content: string) => {
          accumulatedContent += content;
          currentWordCount = accumulatedContent.length;
        },
        onResult: (data: { word_count?: number }) => {
          setProgress(100);
          setStatus('success');
          const finalWordCount = data.word_count || currentWordCount;
          setWordCount(finalWordCount);
          message.success('章节重生成完成');
          setTimeout(() => onSuccess(accumulatedContent, finalWordCount), 500);
        },
        onComplete: () => {
          // no-op
        },
        onError: (error: string, code?: number) => {
          console.error('SSE Error:', error, code);
          setStatus('error');
          setErrorMessage(error || '生成失败');
          message.error(`重生成失败: ${error || '未知错误'}`);
        },
      });
    } catch (error: unknown) {
      console.error('提交失败:', error);
      const err = error as Error;
      setStatus('error');
      setErrorMessage(err.message || '提交失败');
      message.error(`操作失败: ${err.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedSuggestions((prev) => [...prev, index]);
      return;
    }
    setSelectedSuggestions((prev) => prev.filter((i) => i !== index));
  };

  const handleModalCancel = () => {
    if (!loading) {
      onCancel();
      return;
    }
    modal.confirm({
      title: '确认取消',
      content: '章节正在生成中，确定要取消吗？',
      centered: true,
      onOk: () => {
        setLoading(false);
        setStatus('idle');
        onCancel();
      },
    });
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`重新生成章节 - 第 ${chapterNumber} 章：${chapterTitle}`}
        open={visible}
        onCancel={handleModalCancel}
        width={820}
        centered
        footer={
          status === 'success'
            ? null
            : [
                <Button key="cancel" onClick={handleModalCancel} disabled={loading}>
                  取消
                </Button>,
                <Button key="submit" type="primary" onClick={() => void handleSubmit()} loading={loading} icon={<ReloadOutlined />}>
                  开始重生成
                </Button>,
              ]
        }
      >
        {status === 'success' ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="重生成成功"
            description={`共生成 ${wordCount} 字`}
          />
        ) : null}

        {status === 'error' ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
            message="生成失败"
            description={errorMessage}
          />
        ) : null}

        <Form form={form} layout="vertical" disabled={loading || status === 'success'}>
          <Form.Item
            name="modification_source"
            label="修改来源"
            rules={[{ required: true, message: '请选择修改来源' }]}
          >
            <Radio.Group onChange={(e) => setModificationSource(e.target.value)}>
              <Radio value="custom">仅自定义修改</Radio>
              {hasAnalysis && suggestions.length > 0 ? (
                <>
                  <Radio value="analysis_suggestions">仅分析建议</Radio>
                  <Radio value="mixed">混合模式</Radio>
                </>
              ) : null}
            </Radio.Group>
          </Form.Item>

          {hasAnalysis &&
          suggestions.length > 0 &&
          (modificationSource === 'analysis_suggestions' || modificationSource === 'mixed') ? (
            <Form.Item label={`选择分析建议 (${selectedSuggestions.length}/${suggestions.length})`}>
              <Card size="small" style={{ maxHeight: 300, overflow: 'auto' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {suggestions.map((suggestion, index) => (
                    <Checkbox
                      key={index}
                      checked={selectedSuggestions.includes(index)}
                      onChange={(e) => handleSuggestionSelect(index, e.target.checked)}
                    >
                      <Space>
                        <Tag
                          color={
                            suggestion.priority === 'high'
                              ? 'red'
                              : suggestion.priority === 'medium'
                                ? 'orange'
                                : 'blue'
                          }
                        >
                          {suggestion.category}
                        </Tag>
                        <span style={{ fontSize: 13 }}>{suggestion.content}</span>
                      </Space>
                    </Checkbox>
                  ))}
                </Space>
              </Card>
            </Form.Item>
          ) : null}

          {modificationSource === 'custom' || modificationSource === 'mixed' ? (
            <Form.Item name="custom_instructions" label="自定义修改要求" tooltip="描述希望如何改进本章内容。">
              <TextArea
                rows={4}
                placeholder="例如：增强情绪张力，角色对白更自然，补足场景细节。"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          ) : null}

          <Collapse
            ghost
            items={[
              {
                key: 'advanced',
                label: '高级选项',
                children: (
                  <>
                    <Form.Item name="focus_areas" label="重点优化方向">
                      <Checkbox.Group>
                        <Space direction="vertical">
                          <Checkbox value="pacing">节奏控制</Checkbox>
                          <Checkbox value="emotion">情感渲染</Checkbox>
                          <Checkbox value="description">场景描写</Checkbox>
                          <Checkbox value="dialogue">对话质量</Checkbox>
                          <Checkbox value="conflict">冲突强度</Checkbox>
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>

                    <Form.Item label="保留元素">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item name="preserve_structure" valuePropName="checked" noStyle>
                          <Checkbox>保留整体结构与情节框架</Checkbox>
                        </Form.Item>
                        <Form.Item name="preserve_character_traits" valuePropName="checked" noStyle>
                          <Checkbox>保持角色性格一致</Checkbox>
                        </Form.Item>
                      </Space>
                    </Form.Item>

                    <Form.Item
                      name="target_word_count"
                      label="目标字数"
                      tooltip="目标字数为参考值，实际生成可能有一定浮动。"
                    >
                      <InputNumber min={500} max={10000} step={500} style={{ width: '100%' }} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>

        <SSEProgressModal
          visible={status === 'generating'}
          progress={progress}
          message={`正在重新生成中...（已生成 ${wordCount} 字）`}
          title="重新生成章节"
        />
      </Modal>
    </>
  );
}
