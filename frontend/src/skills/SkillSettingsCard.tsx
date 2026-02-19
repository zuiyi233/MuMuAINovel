import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Select, Space, Typography, message, Popconfirm } from 'antd';
import { ReloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { skillsApi, settingsApi } from '../services/api';
import type { SkillSpecResponse, Settings } from '../types';
import { importSkillsFromZip, type ImportResult } from '../utils/localSkillsImport';
import { localSkills, getActiveLocalSkillId, setActiveLocalSkillId, type LocalSkill } from '../utils/localSkillsDb';

const { Text } = Typography;

interface SyncResponse {
  discovered: number;
  upserted: number;
  skipped: number;
  errors: number;
  deleted?: number;
  roots_used?: string[];
  error_messages: string[];
}

function redactErrorMessage(msg: string): string {
  const labeledMatch = msg.match(/^(repo|global):(.+?):\s*(.*)$/);
  if (labeledMatch) {
    const [, label, path, reason] = labeledMatch;
    const basename = path.split(/[/\\]/).pop() || path;
    return `${label}:${basename}:${reason}`;
  }

  if (msg.includes('/') || msg.includes('\\')) {
    const lastColonIndex = msg.lastIndexOf(':');
    if (lastColonIndex > 0) {
      const reasonPart = msg.slice(lastColonIndex + 1);
      return `"(路径已隐藏)":${reasonPart.trim()}`;
    }
    return '"(路径已隐藏)"';
  }

  return msg;
}

function safeParsePreferences(preferences?: string): Record<string, unknown> {
  if (!preferences) return {};
  try {
    return JSON.parse(preferences) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Encoding helpers for unified selection
const encodeServer = (key: string): string => `server:${key}`;
const encodeLocal = (id: string): string => `local:${id}`;

type DecodedValue = { kind: 'none' } | { kind: 'server'; id: string } | { kind: 'local'; id: string };

function decode(value: string): DecodedValue {
  if (value === '__none__') {
    return { kind: 'none' };
  }
  if (value.startsWith('server:')) {
    return { kind: 'server', id: value.slice(7) };
  }
  if (value.startsWith('local:')) {
    return { kind: 'local', id: value.slice(6) };
  }
  return { kind: 'none' };
}

export function SkillSettingsCard() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillSpecResponse[]>([]);
  const [localSkillItems, setLocalSkillItems] = useState<LocalSkill[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('__none__');
  const [lastSync, setLastSync] = useState<SyncResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const serverOptions = skills.map((s) => ({
      value: encodeServer(s.skill_key),
      label: s.name,
    }));
    const localOptions = localSkillItems.map((ls) => ({
      value: encodeLocal(ls.id),
      label: ls.name,
    }));
    return [
      { value: '__none__', label: '不启用技能' },
      { label: '云端技能', options: serverOptions },
      { label: '本地技能', options: localOptions },
    ];
  }, [skills, localSkillItems]);

  const activeSkill = useMemo(() => {
    const decoded = decode(selectedValue);
    if (decoded.kind !== 'server') return null;
    return skills.find((s) => s.skill_key === decoded.id) || null;
  }, [selectedValue, skills]);

  const activeLocalSkill = useMemo(() => {
    const decoded = decode(selectedValue);
    if (decoded.kind !== 'local') return null;
    return localSkillItems.find((ls) => ls.id === decoded.id) || null;
  }, [selectedValue, localSkillItems]);

  async function reloadAll() {
    setLoading(true);
    try {
      const sync = await skillsApi.sync();
      setLastSync(sync as SyncResponse);
      const list = await skillsApi.list();
      setSkills(list.items || []);

      const localList = await localSkills.listAllByUpdated();
      setLocalSkillItems(localList);

      const settings: Settings = await settingsApi.getSettings();
      const prefs = safeParsePreferences(settings.preferences);
      const serverKey = typeof prefs.active_skill_key === 'string' ? (prefs.active_skill_key as string) : null;
      const localId = await getActiveLocalSkillId();

      if (localId) {
        setSelectedValue(encodeLocal(localId));
      } else if (serverKey) {
        setSelectedValue(encodeServer(serverKey));
      } else {
        setSelectedValue('__none__');
      }
    } finally {
      setLoading(false);
    }
  }

  async function activate(next: string) {
    const decoded = decode(next);
    setSelectedValue(next);
    setLoading(true);
    try {
      if (decoded.kind === 'none') {
        await skillsApi.activate(null);
        await setActiveLocalSkillId(null);
        message.success('技能已关闭');
      } else if (decoded.kind === 'server') {
        await skillsApi.activate(decoded.id);
        await setActiveLocalSkillId(null);
        message.success('技能已启用');
      } else if (decoded.kind === 'local') {
        await skillsApi.activate(null);
        await setActiveLocalSkillId(decoded.id);
        message.success('本地技能已启用');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setImporting(true);
    setImportResult(null);
    try {
      const result = await importSkillsFromZip(file, file.name);
      setImportResult(result);
      if (result.imported > 0) {
        message.success(`成功导入 ${result.imported} 个技能`);
      }
      if (result.rejected > 0) {
        message.warning(`拒绝 ${result.rejected} 个无效技能`);
      }
      const localList = await localSkills.listAllByUpdated();
      setLocalSkillItems(localList);
    } catch (e) {
      message.error(`导入失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setImporting(false);
    }
  }

  const handleDeleteLocalSkill = async (id: string) => {
    try {
      await localSkills.delete(id);
      const decoded = decode(selectedValue);
      if (decoded.kind === 'local' && decoded.id === id) {
        setSelectedValue('__none__');
        await setActiveLocalSkillId(null);
      }
      const localList = await localSkills.listAllByUpdated();
      setLocalSkillItems(localList);
      message.success('本地技能已删除');
    } catch (e) {
      message.error(`删除失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  useEffect(() => {
    void reloadAll();
  }, []);

  return (
    <Card
      title="技能"
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: 'var(--shadow-card)',
        background: 'var(--color-bg-container)',
        border: '1px solid var(--color-border-light)',
      }}
      extra={
        <Space>
          <input
            type="file"
            accept=".zip"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            icon={<UploadOutlined />}
            loading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            导入本地技能(ZIP)
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={reloadAll}>
            同步
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Select
          value={selectedValue}
          onChange={activate}
          options={options}
          loading={loading}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
        />
        <Text type="secondary">同步会从 .opencode/skills 导入最新技能规范，并让 AI 调用自动应用到系统提示词。</Text>

        {lastSync && (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text>
              同步结果：发现 {lastSync.discovered} / 更新 {lastSync.upserted} / 删除 {lastSync.deleted ?? 0} / 错误 {lastSync.errors}
            </Text>
            <Text type="secondary">
              根目录：{lastSync.roots_used?.length ? lastSync.roots_used.join(', ') : '无'}
            </Text>
            {lastSync.error_messages.length > 0 && (
              <Space direction="vertical" size={2}>
                {lastSync.error_messages.slice(0, 3).map((msg, idx) => (
                  <Text key={idx} type="danger" style={{ fontSize: 12 }}>
                    {redactErrorMessage(msg)}
                  </Text>
                ))}
                {lastSync.error_messages.length > 3 && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    +{lastSync.error_messages.length - 3} 更多错误
                  </Text>
                )}
              </Space>
            )}
          </Space>
        )}

        {importResult && (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text>
              ZIP导入结果：导入 {importResult.imported} / 拒绝 {importResult.rejected}
            </Text>
            {importResult.errors.length > 0 && (
              <Space direction="vertical" size={2}>
                {importResult.errors.slice(0, 5).map((err, idx) => (
                  <Text key={idx} type="danger" style={{ fontSize: 12 }}>
                    {err.path === '__more__' ? err.reason : `${err.path}: ${err.reason}`}
                  </Text>
                ))}
              </Space>
            )}
          </Space>
        )}

        {activeLocalSkill ? (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {activeLocalSkill.description && (
              <Text type="secondary">{activeLocalSkill.description}</Text>
            )}
            <Text type="secondary">更新时间：{activeLocalSkill.updated_at}</Text>
            {(() => {
              const source = activeLocalSkill.source_meta;
              if (source && typeof source === 'object') {
                const zipName = source.zip_name as string | undefined;
                const entryPath = source.entry_path as string | undefined;
                if (zipName || entryPath) {
                  return <Text type="secondary">来源：{zipName} {entryPath}</Text>;
                }
              }
              return <Text type="secondary">来源：未知</Text>;
            })()}
            <Popconfirm
              title="确定删除此本地技能？"
              onConfirm={() => handleDeleteLocalSkill(activeLocalSkill.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                删除本地技能
              </Button>
            </Popconfirm>
          </Space>
        ) : activeSkill ? (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {activeSkill.allowed_tools ? (
              <Text type="secondary">允许工具：{activeSkill.allowed_tools}</Text>
            ) : (
              <Text type="secondary">允许工具：不限制</Text>
            )}
            {activeSkill.api_provider_override ? (
              <Text type="secondary">Provider 覆盖：{activeSkill.api_provider_override}</Text>
            ) : null}
            {activeSkill.model_override ? (
              <Text type="secondary">模型覆盖：{activeSkill.model_override}</Text>
            ) : null}
            {activeSkill.temperature_override ? (
              <Text type="secondary">温度覆盖：{activeSkill.temperature_override}</Text>
            ) : null}
            {activeSkill.max_tokens_override ? (
              <Text type="secondary">Max tokens 覆盖：{activeSkill.max_tokens_override}</Text>
            ) : null}
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}
