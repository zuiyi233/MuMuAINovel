import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface CareerDetail {
  id: string;
  character_id: string;
  career_id: string;
  career_name: string;
  career_type: 'main' | 'sub';
  current_stage: number;
  stage_name: string;
  stage_description?: string;
  stage_progress: number;
  max_stage: number;
  started_at?: string;
  reached_current_stage_at?: string;
  notes?: string;
}

interface Career {
  id: string;
  name: string;
  type: 'main' | 'sub';
  max_stage: number;
}

interface CharacterCareerCardProps {
  characterId: string;
  projectId: string;
  editable?: boolean;
  onUpdate?: () => void;
}

type AssignCareerFormValues = {
  career_id: string;
  current_stage?: number;
  started_at?: string;
};

type ProgressFormValues = {
  current_stage: number;
  stage_progress: number;
  reached_current_stage_at?: string;
  notes?: string;
};

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const CharacterCareerCard = ({
  characterId,
  projectId,
  editable = false,
  onUpdate,
}: CharacterCareerCardProps) => {
  const [mainCareer, setMainCareer] = useState<CareerDetail | null>(null);
  const [subCareers, setSubCareers] = useState<CareerDetail[]>([]);
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<CareerDetail | null>(null);

  const [mainForm] = Form.useForm<AssignCareerFormValues>();
  const [subForm] = Form.useForm<AssignCareerFormValues>();
  const [progressForm] = Form.useForm<ProgressFormValues>();
  const [modal, contextHolder] = Modal.useModal();

  const mainCareerOptions = useMemo(
    () => allCareers.filter((career) => career.type === 'main'),
    [allCareers],
  );

  const subCareerOptions = useMemo(
    () => allCareers.filter((career) => career.type === 'sub'),
    [allCareers],
  );

  const fetchCharacterCareers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/careers/character/${characterId}/careers`,
        getAuthHeaders(),
      );
      setMainCareer(response.data.main_career || null);
      setSubCareers(response.data.sub_careers || []);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      message.error(axiosError.response?.data?.detail || '获取职业信息失败');
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  const fetchAllCareers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/careers`, {
        params: { project_id: projectId },
        ...getAuthHeaders(),
      });
      const main = response.data.main_careers || [];
      const sub = response.data.sub_careers || [];
      setAllCareers([...main, ...sub]);
    } catch (error) {
      console.error('Load careers failed:', error);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchCharacterCareers();
    if (editable) {
      void fetchAllCareers();
    }
  }, [editable, fetchAllCareers, fetchCharacterCareers]);

  const handleSetMainCareer = async (values: AssignCareerFormValues) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/careers/character/${characterId}/careers/main`,
        values,
        getAuthHeaders(),
      );
      message.success('主职业设置成功');
      setIsMainModalOpen(false);
      mainForm.resetFields();
      await fetchCharacterCareers();
      onUpdate?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      message.error(axiosError.response?.data?.detail || '设置主职业失败');
    }
  };

  const handleAddSubCareer = async (values: AssignCareerFormValues) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/careers/character/${characterId}/careers/sub`,
        values,
        getAuthHeaders(),
      );
      message.success('副职业添加成功');
      setIsSubModalOpen(false);
      subForm.resetFields();
      await fetchCharacterCareers();
      onUpdate?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      message.error(axiosError.response?.data?.detail || '添加副职业失败');
    }
  };

  const handleUpdateProgress = async (values: ProgressFormValues) => {
    if (!selectedCareer) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/careers/character/${characterId}/careers/${selectedCareer.career_id}/stage`,
        values,
        getAuthHeaders(),
      );
      message.success('职业阶段更新成功');
      setIsProgressModalOpen(false);
      progressForm.resetFields();
      await fetchCharacterCareers();
      onUpdate?.();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      message.error(axiosError.response?.data?.detail || '更新职业阶段失败');
    }
  };

  const handleRemoveSubCareer = (careerId: string) => {
    modal.confirm({
      title: '确认移除副职业',
      content: '该操作会移除角色与副职业的关联，是否继续？',
      centered: true,
      onOk: async () => {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/careers/character/${characterId}/careers/${careerId}`,
            getAuthHeaders(),
          );
          message.success('副职业已移除');
          await fetchCharacterCareers();
          onUpdate?.();
        } catch (error: unknown) {
          const axiosError = error as { response?: { data?: { detail?: string } } };
          message.error(axiosError.response?.data?.detail || '移除副职业失败');
        }
      },
    });
  };

  const openProgressModal = (career: CareerDetail) => {
    setSelectedCareer(career);
    progressForm.setFieldsValue({
      current_stage: career.current_stage,
      stage_progress: career.stage_progress,
      reached_current_stage_at: career.reached_current_stage_at || '',
      notes: career.notes || '',
    });
    setIsProgressModalOpen(true);
  };

  const renderCareerInfo = (career: CareerDetail, isMain = false) => (
    <div key={career.id} style={{ marginBottom: 'var(--space-md)' }}>
      <div className="u-flex-between" style={{ gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
        <Space>
          <TrophyOutlined style={{ color: isMain ? 'var(--color-info)' : 'var(--color-text-tertiary)' }} />
          <Text strong={isMain}>{career.career_name}</Text>
          {isMain ? <Tag color="blue">主职业</Tag> : null}
        </Space>
        {editable ? (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openProgressModal(career)} />
            {!isMain ? (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveSubCareer(career.career_id)}
              />
            ) : null}
          </Space>
        ) : null}
      </div>

      <div style={{ marginLeft: 'var(--space-lg)', marginTop: 'var(--space-xs)' }}>
        <Text type="secondary">
          {career.stage_name}（第 {career.current_stage}/{career.max_stage} 阶段）
        </Text>

        {career.stage_description ? (
          <Paragraph type="secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2xs)' }}>
            {career.stage_description}
          </Paragraph>
        ) : null}

        <Progress
          percent={career.stage_progress}
          size="small"
          style={{ marginTop: 'var(--space-xs)', marginBottom: 0 }}
          format={(percent) => `${percent}%`}
        />

        {career.started_at ? (
          <Text type="secondary" style={{ display: 'block', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2xs)' }}>
            开始时间：{career.started_at}
          </Text>
        ) : null}

        {career.notes ? (
          <Paragraph type="secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2xs)' }}>
            备注：{career.notes}
          </Paragraph>
        ) : null}
      </div>
    </div>
  );

  if (loading) {
    return <Card loading />;
  }

  return (
    <>
      {contextHolder}

      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>职业信息</span>
          </Space>
        }
        extra={
          editable && !mainCareer ? (
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                mainForm.resetFields();
                setIsMainModalOpen(true);
              }}
            >
              设置主职业
            </Button>
          ) : null
        }
      >
        {mainCareer ? (
          <>
            {renderCareerInfo(mainCareer, true)}

            {subCareers.length ? (
              <>
                <Divider />
                <Text type="secondary">副职业</Text>
                <div style={{ marginTop: 'var(--space-xs)' }}>
                  {subCareers.map((career) => renderCareerInfo(career))}
                </div>
              </>
            ) : null}

            {editable && subCareers.length < 5 ? (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    subForm.resetFields();
                    setIsSubModalOpen(true);
                  }}
                >
                  添加副职业
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 'var(--space-md) 0' }}>
            暂无职业信息
          </Text>
        )}
      </Card>

      <Modal
        title="设置主职业"
        open={isMainModalOpen}
        onCancel={() => setIsMainModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={mainForm} layout="vertical" onFinish={handleSetMainCareer}>
          <Form.Item label="选择主职业" name="career_id" rules={[{ required: true, message: '请选择主职业' }]}>
            <Select placeholder="请选择职业">
              {mainCareerOptions.map((career) => (
                <Select.Option key={career.id} value={career.id}>
                  {career.name}（{career.max_stage} 阶段）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="当前阶段" name="current_stage" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="开始时间" name="started_at">
            <Input placeholder="例如：修真历 1000 年" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsMainModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加副职业"
        open={isSubModalOpen}
        onCancel={() => setIsSubModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={subForm} layout="vertical" onFinish={handleAddSubCareer}>
          <Form.Item label="选择副职业" name="career_id" rules={[{ required: true, message: '请选择副职业' }]}>
            <Select placeholder="请选择职业">
              {subCareerOptions.map((career) => (
                <Select.Option key={career.id} value={career.id}>
                  {career.name}（{career.max_stage} 阶段）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="当前阶段" name="current_stage" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="开始时间" name="started_at">
            <Input placeholder="例如：修真历 1000 年" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsSubModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新职业进度"
        open={isProgressModalOpen}
        onCancel={() => setIsProgressModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedCareer ? (
          <Form form={progressForm} layout="vertical" onFinish={handleUpdateProgress}>
            <Text style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
              当前职业：{selectedCareer.career_name}
            </Text>
            <Form.Item label="当前阶段" name="current_stage" rules={[{ required: true, message: '请输入阶段' }]}>
              <InputNumber min={1} max={selectedCareer.max_stage} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="阶段进度（0-100）"
              name="stage_progress"
              rules={[{ required: true, message: '请输入阶段进度' }]}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="到达时间" name="reached_current_stage_at">
              <Input placeholder="例如：修真历 1001 年" />
            </Form.Item>
            <Form.Item label="备注" name="notes">
              <TextArea rows={2} placeholder="例如：突破至金丹期" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsProgressModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit">
                  更新
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </>
  );
};

export default CharacterCareerCard;
