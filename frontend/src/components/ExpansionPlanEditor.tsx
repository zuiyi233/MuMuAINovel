import { useCallback, useEffect, useState } from 'react';
import { Button, Divider, Form, Input, InputNumber, message, Modal, Select, Space, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { characterApi } from '../services/api';
import type { Character, ExpansionPlanData } from '../types';

const { TextArea } = Input;
const { Text } = Typography;

interface ExpansionPlanEditorProps {
  visible: boolean;
  planData: ExpansionPlanData | null;
  chapterSummary: string | null;
  projectId: string;
  onSave: (data: ExpansionPlanData & { summary?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ExpansionPlanEditor({
  visible,
  planData,
  chapterSummary,
  projectId,
  onSave,
  onCancel,
}: ExpansionPlanEditorProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyEventInput, setKeyEventInput] = useState('');
  const [keyEvents, setKeyEvents] = useState<string[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  const loadCharacters = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingCharacters(true);
      setAvailableCharacters([]);
      const response = await characterApi.getCharacters(projectId);

      let chars: Character[] = [];
      if (Array.isArray(response)) {
        chars = response;
      } else if (response && typeof response === 'object' && 'items' in response) {
        const responseObj = response as { items?: Character[] };
        if (Array.isArray(responseObj.items)) {
          chars = responseObj.items;
        }
      }
      setAvailableCharacters(chars);
    } catch (error: unknown) {
      console.error('加载角色列表失败:', error);
      const err = error as Error;
      message.error(`加载角色列表失败: ${err?.message || '未知错误'}`);
      setAvailableCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (visible && projectId) {
      void loadCharacters();
    }
  }, [loadCharacters, projectId, visible]);

  useEffect(() => {
    if (!visible) return;
    if (planData) {
      setKeyEvents(planData.key_events || []);
      setCharacters(planData.character_focus || []);
      form.setFieldsValue({
        summary: chapterSummary || '',
        emotional_tone: planData.emotional_tone,
        narrative_goal: planData.narrative_goal,
        conflict_type: planData.conflict_type,
        estimated_words: planData.estimated_words,
      });
    } else {
      setKeyEvents([]);
      setCharacters([]);
      form.setFieldsValue({ summary: chapterSummary || '' });
    }
  }, [chapterSummary, form, planData, visible]);

  const handleAddKeyEvent = () => {
    if (!keyEventInput.trim()) return;
    setKeyEvents((prev) => [...prev, keyEventInput.trim()]);
    setKeyEventInput('');
  };

  const handleAddCharacter = (characterName: string) => {
    if (!characterName || characters.includes(characterName)) return;
    setCharacters((prev) => [...prev, characterName]);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (keyEvents.length === 0) {
        message.warning('请至少添加一个关键事件');
        return;
      }
      if (characters.length === 0) {
        message.warning('请至少添加一个涉及角色');
        return;
      }

      await onSave({
        summary: values.summary,
        key_events: keyEvents,
        character_focus: characters,
        emotional_tone: values.emotional_tone,
        narrative_goal: values.narrative_goal,
        conflict_type: values.conflict_type,
        estimated_words: values.estimated_words,
        scenes: planData?.scenes || null,
      });
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setKeyEvents([]);
    setCharacters([]);
    setKeyEventInput('');
    onCancel();
  };

  return (
    <Modal
      title="编辑章节扩写规划"
      open={visible}
      onCancel={handleCancel}
      width={720}
      centered
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          保存
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          emotional_tone: '紧张激烈',
          conflict_type: '人物冲突',
          estimated_words: 3000,
        }}
      >
        <Form.Item label="剧情摘要" name="summary" tooltip="简要描述本章的核心情节走向。">
          <TextArea
            rows={3}
            placeholder="例如：主角在调查线索时意外暴露身份，随后与反派正面交锋。"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Divider orientation="left">详细规划</Divider>

        <Form.Item label="关键事件" tooltip="至少添加一个关键事件。" required>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入关键事件后按回车或点击添加"
                value={keyEventInput}
                onChange={(e) => setKeyEventInput(e.target.value)}
                onPressEnter={handleAddKeyEvent}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddKeyEvent}>
                添加
              </Button>
            </Space.Compact>

            <Space wrap>
              {keyEvents.map((event, idx) => (
                <Tag
                  key={`${idx}-${event}`}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    setKeyEvents((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  color="purple"
                  style={{ marginBottom: 8 }}
                >
                  <span style={{ fontWeight: 700, marginRight: 4 }}>#{idx + 1}</span>
                  {event}
                </Tag>
              ))}
            </Space>
          </Space>
        </Form.Item>

        <Form.Item label="涉及角色" tooltip="从项目已有角色中选择。" required>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              placeholder="选择角色"
              style={{ width: '100%' }}
              loading={loadingCharacters}
              onChange={handleAddCharacter}
              value={undefined}
              showSearch
              optionFilterProp="label"
              options={availableCharacters
                .filter((char) => !characters.includes(char.name))
                .map((char) => ({ label: char.name, value: char.name }))}
              notFoundContent={
                loadingCharacters
                  ? '加载中...'
                  : availableCharacters.length === 0
                    ? '暂无可选角色，请先在角色管理中创建'
                    : '全部角色均已添加'
              }
            />

            <Space wrap>
              {characters.map((char) => (
                <Tag key={char} closable onClose={() => setCharacters((prev) => prev.filter((v) => v !== char))} color="cyan">
                  {char}
                </Tag>
              ))}
            </Space>
          </Space>
        </Form.Item>

        <Form.Item label="情感基调" name="emotional_tone" rules={[{ required: true, message: '请输入情感基调' }]}>
          <Input placeholder="例如：紧张激烈、压抑克制、轻松诙谐" maxLength={20} />
        </Form.Item>

        <Form.Item label="冲突类型" name="conflict_type" rules={[{ required: true, message: '请输入冲突类型' }]}>
          <Input placeholder="例如：人物冲突、内心冲突、环境冲突" maxLength={20} />
        </Form.Item>

        <Form.Item label="预估字数" name="estimated_words" rules={[{ required: true, message: '请输入预估字数' }]}>
          <InputNumber
            min={500}
            max={10000}
            step={100}
            style={{ width: '100%' }}
            formatter={(value) => `${value} 字`}
            parser={(value) => Number((value || '').replace(' 字', '')) as 500 | 10000}
          />
        </Form.Item>

        <Form.Item label="叙事目标" name="narrative_goal" rules={[{ required: true, message: '请输入叙事目标' }]}>
          <TextArea
            rows={3}
            placeholder="例如：推进主线矛盾，揭示关键信息，制造下一章悬念。"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 12 }}>
          保存后会同步更新本章扩写规划，用于后续 AI 生成时的上下文控制。
        </Text>
      </Form>
    </Modal>
  );
}
