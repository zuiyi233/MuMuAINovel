import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Grid,
  Modal,
  Progress,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  ApiOutlined,
  BookOutlined,
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  LoadingOutlined,
  SettingOutlined,
  TrophyOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { exportLocalBackup, importLocalBackupReplace, validateLocalBackupFile } from '../utils/localBackup';
import type { BackupStatistics, ValidationResult } from '../utils/localBackup';
import { useStore } from '../store';
import { useProjectSync } from '../store/hooks';
import { eventBus, EventNames } from '../store/eventBus';
import type { Project } from '../types';
import { AppShell } from '../components/layout';
import { FeedbackBanner, MetricPill, SectionBlock, StatusBadge } from '../components/ui';
import { ExportModal, ImportModal, ProjectCard, ProjectGrid, QuickStartCard } from '../components/project-list';
import UserMenu from '../components/UserMenu';
import ChangelogFloatingButton from '../components/ChangelogFloatingButton';
import SettingsPage from './Settings';
import MCPPluginsPage from './MCPPlugins';
import PromptTemplates from './PromptTemplates';

const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

type ProjectListView = 'projects' | 'settings' | 'mcp' | 'prompts';
type ProjectStatus = Project['status'];
type StatusIntent = 'default' | 'success' | 'warning' | 'info';

type ViewMeta = {
  title: string;
  subtitle: string;
  path: string;
};

type ProjectStatusMeta = {
  label: string;
  intent: StatusIntent;
  icon: ReactNode;
};

const VIEW_META: Record<ProjectListView, ViewMeta> = {
  projects: {
    title: '我的书架',
    subtitle: '管理项目并继续创作',
    path: '/projects',
  },
  settings: {
    title: 'API 设置',
    subtitle: '管理模型接口与系统参数',
    path: '/settings',
  },
  mcp: {
    title: 'MCP 插件',
    subtitle: '管理插件配置与工具能力',
    path: '/mcp-plugins',
  },
  prompts: {
    title: '提示词模板',
    subtitle: '维护全局提示词模板',
    path: '/prompt-templates',
  },
};

const VIEW_PATH_MAP: Record<ProjectListView, string> = {
  projects: '/projects',
  settings: '/settings',
  mcp: '/mcp-plugins',
  prompts: '/prompt-templates',
};

const PROJECT_MENU_ITEMS: MenuProps['items'] = [
  {
    key: 'projects',
    icon: <BookOutlined />,
    label: '我的书架',
  },
  {
    type: 'group',
    label: '创作工具',
    children: [
      {
        key: 'prompts',
        icon: <FileSearchOutlined />,
        label: '提示词模板',
      },
      {
        key: 'mcp',
        icon: <ApiOutlined />,
        label: 'MCP 插件',
      },
    ],
  },
  {
    type: 'group',
    label: '系统设置',
    children: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'API 设置',
      },
    ],
  },
];

const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  planning: {
    label: '规划中',
    intent: 'info',
    icon: <CalendarOutlined />,
  },
  writing: {
    label: '创作中',
    intent: 'success',
    icon: <EditOutlined />,
  },
  revising: {
    label: '修订中',
    intent: 'warning',
    icon: <FileTextOutlined />,
  },
  completed: {
    label: '已完结',
    intent: 'default',
    icon: <TrophyOutlined />,
  },
};

const BACKUP_STAT_ITEMS: Array<{ key: keyof BackupStatistics; label: string; color?: string }> = [
  { key: 'projects', label: '项目', color: 'blue' },
  { key: 'chapters', label: '章节', color: 'green' },
  { key: 'characters', label: '角色', color: 'cyan' },
  { key: 'outlines', label: '大纲', color: 'purple' },
  { key: 'relationships', label: '关系', color: 'magenta' },
  { key: 'organizations', label: '组织', color: 'orange' },
  { key: 'foreshadows', label: '伏笔', color: 'volcano' },
  { key: 'careers', label: '职业', color: 'gold' },
  { key: 'character_careers', label: '职业关联', color: 'geekblue' },
  { key: 'writing_styles', label: '写作风格', color: 'lime' },
  { key: 'story_memories', label: '故事记忆' },
  { key: 'plot_analysis', label: '剧情分析' },
  { key: 'generation_history', label: '生成历史' },
];

const formatWordCount = (count: number): string => {
  if (count < 1000) return String(count);
  if (count < 10000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (count < 1000000) return `${(count / 10000).toFixed(1).replace(/\.0$/, '')}W`;
  return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
};

const resolveViewFromPath = (pathname: string): ProjectListView => {
  if (pathname === '/' || pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/mcp-plugins')) return 'mcp';
  if (pathname.startsWith('/prompt-templates')) return 'prompts';
  return 'projects';
};

const getProgress = (current: number, target: number): number => {
  if (!target || target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'var(--color-success)';
  if (progress >= 50) return 'var(--color-info)';
  if (progress >= 20) return 'var(--color-warning)';
  return 'var(--color-error)';
};

const getDisplayStatus = (status: ProjectStatus, progress: number): ProjectStatus =>
  progress >= 100 ? 'completed' : status;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
};

const parseTags = (genre?: string): string[] => {
  if (!genre) return [];
  return genre
    .split(/[,、，]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const isProjectListView = (value: string): value is ProjectListView =>
  value === 'projects' || value === 'settings' || value === 'mcp' || value === 'prompts';

export default function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { projects, loading } = useStore();
  const { refreshProjects, deleteProject } = useProjectSync();

  const [modal, contextHolder] = Modal.useModal();
  const [activeView, setActiveView] = useState<ProjectListView>(() => resolveViewFromPath(location.pathname));
  const [showApiTip, setShowApiTip] = useState(true);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const navigateToView = useCallback(
    (view: ProjectListView) => {
      setActiveView(view);
      const nextPath = VIEW_PATH_MAP[view];
      if (view === 'projects' && location.pathname === '/') return;
      if (location.pathname !== nextPath) {
        navigate(nextPath);
      }
    },
    [location.pathname, navigate],
  );

  const handleSwitchToMcp = useCallback(() => {
    navigate('/mcp-plugins');
  }, [navigate]);

  useEffect(() => {
    setActiveView(resolveViewFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    void refreshProjects();
    eventBus.on(EventNames.SWITCH_TO_MCP_VIEW, handleSwitchToMcp);
    return () => {
      eventBus.off(EventNames.SWITCH_TO_MCP_VIEW, handleSwitchToMcp);
    };
  }, [handleSwitchToMcp, refreshProjects]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshProjects();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProjects]);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: '确认删除项目',
      content: '删除后将同步移除该项目下所有相关数据，且不可恢复。',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      centered: true,
      onOk: async () => {
        try {
          await deleteProject(id);
          message.success('项目已删除');
        } catch {
          message.error('删除失败，请重试');
        }
      },
    });
  };

  const handleEnterProject = (project: Project) => {
    if (project.wizard_status === 'incomplete') {
      navigate(`/wizard?project_id=${project.id}`);
      return;
    }
    navigate(`/project/${project.id}`);
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    try {
      setValidating(true);
      const result = await validateLocalBackupFile(file);
      setValidationResult(result);
      if (!result.valid) {
        message.error('备份文件校验失败');
      }
    } catch (error) {
      console.error('Validate backup failed:', error);
      message.error('备份文件校验失败');
    } finally {
      setValidating(false);
    }
    return false;
  };

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.valid) {
      message.warning('请先选择可用的备份文件');
      return;
    }
    try {
      setImporting(true);
      const result = await importLocalBackupReplace(selectedFile);
      if (!result.success) {
        throw new Error(result.message || 'Import failed');
      }
      message.success(result.message);
      setImportModalVisible(false);
      setSelectedFile(null);
      setValidationResult(null);
      await refreshProjects();
      if (result.project_ids.length === 1) {
        navigate(`/project/${result.project_ids[0]}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      message.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setImportModalVisible(false);
    setSelectedFile(null);
    setValidationResult(null);
  };

  const handleOpenExportModal = () => {
    setExportModalVisible(true);
    setSelectedProjectIds([]);
  };

  const handleCloseExportModal = () => {
    setExportModalVisible(false);
    setSelectedProjectIds([]);
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  };

  const exportableProjects = projects;

  const handleToggleAll = () => {
    if (selectedProjectIds.length === exportableProjects.length) {
      setSelectedProjectIds([]);
      return;
    }
    setSelectedProjectIds(exportableProjects.map((project) => project.id));
  };

  const handleExport = async () => {
    if (!selectedProjectIds.length) {
      message.warning('请至少选择一个项目');
      return;
    }
    try {
      setExporting(true);
      const result = await exportLocalBackup(selectedProjectIds);
      message.success(`导出成功：${result.filename}`);
      handleCloseExportModal();
    } catch (error) {
      console.error('Export failed:', error);
      message.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setSelectedProjectIds((prev) =>
      prev.filter((id) => exportableProjects.some((project) => project.id === id)),
    );
  }, [exportableProjects]);

  const totalWords = useMemo(
    () => projects.reduce((sum, project) => sum + (project.current_words || 0), 0),
    [projects],
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === 'writing').length,
    [projects],
  );

  const completedProjects = useMemo(
    () =>
      projects.filter((project) => {
        const progress = getProgress(project.current_words || 0, project.target_words || 0);
        return project.status === 'completed' || progress >= 100;
      }).length,
    [projects],
  );

  const viewMeta = VIEW_META[activeView];

  const importFileList = useMemo<UploadFile[]>(
    () =>
      selectedFile
        ? [
            {
              uid: 'selected-backup',
              name: selectedFile.name,
              status: 'done',
            },
          ]
        : [],
    [selectedFile],
  );

  const visibleBackupStats = useMemo(() => {
    if (!validationResult) return [];
    return BACKUP_STAT_ITEMS.filter((item) => {
      const value = validationResult.statistics[item.key];
      if (typeof value === 'boolean') return value;
      return value > 0;
    });
  }, [validationResult]);

  const headerMetrics =
    activeView === 'projects' ? (
      <Space size="small" wrap>
        <MetricPill label="项目总数" value={`${projects.length} 本`} />
        <MetricPill label="创作中" value={`${activeProjects} 本`} />
        <MetricPill label="已完结" value={`${completedProjects} 本`} />
        <MetricPill label="总字数" value={`${formatWordCount(totalWords)} 字`} tone="primary" />
      </Space>
    ) : null;

  const headerActions =
    activeView === 'projects' ? (
      <Space size="small">
        <Button
          className="app-shell__header-button"
          icon={<UploadOutlined />}
          onClick={() => setImportModalVisible(true)}
        >
          导入
        </Button>
        <Button
          className="app-shell__header-button"
          icon={<DownloadOutlined />}
          onClick={handleOpenExportModal}
          disabled={exportableProjects.length === 0}
        >
          导出
        </Button>
      </Space>
    ) : null;

  const renderProjectStatus = (project: Project, progress: number) => {
    if (project.wizard_status === 'incomplete') {
      return (
        <StatusBadge intent="warning" icon={<LoadingOutlined />}>
          生成中
        </StatusBadge>
      );
    }

    const status = getDisplayStatus(project.status, progress);
    const config = PROJECT_STATUS_META[status];
    return (
      <StatusBadge intent={config.intent} icon={config.icon}>
        {config.label}
      </StatusBadge>
    );
  };

  const renderProjectCard = (project: Project) => {
    const progress = getProgress(project.current_words || 0, project.target_words || 0);
    const tags = parseTags(project.genre);

    return (
      <ProjectCard
        key={project.id}
        style={{ height: '100%' }}
        bodyStyle={{ padding: 0 }}
        onClick={() => handleEnterProject(project)}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--color-border-light)',
              display: 'grid',
              gap: 'var(--space-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--space-xs)',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <Tooltip title={project.title}>
                  <div
                    className="u-truncate"
                    style={{
                      fontSize: 'var(--font-size-md)',
                      lineHeight: 1.35,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {project.title}
                  </div>
                </Tooltip>

                <Space size={[4, 4]} wrap style={{ marginTop: 'var(--space-xs)' }}>
                  {(tags.length ? tags : ['未分类']).map((tag) => (
                    <Tag key={tag} color="green" style={{ margin: 0 }}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>

              {renderProjectStatus(project, progress)}
            </div>

            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                minHeight: '44px',
              }}
            >
              {project.description || '暂无项目描述'}
            </Paragraph>
          </div>

          <div
            style={{
              padding: 'var(--space-md)',
              display: 'grid',
              gap: 'var(--space-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <span>创作进度</span>
              <span style={{ fontWeight: 600, color: getProgressColor(progress) }}>{progress}%</span>
            </div>

            <Progress
              percent={progress}
              showInfo={false}
              strokeColor={getProgressColor(progress)}
              trailColor="var(--color-border-secondary)"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-xs)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-layout)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-mono)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {formatWordCount(project.current_words || 0)}
                </div>
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  已写字数
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-mono)',
                    color: 'var(--color-success)',
                  }}
                >
                  {formatWordCount(project.target_words || 0)}
                </div>
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  目标字数
                </Text>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: 'var(--space-sm) var(--space-md)',
              borderTop: '1px solid var(--color-border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text type="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
              <CalendarOutlined />
              <span>{formatDate(project.updated_at)}</span>
            </Text>

            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(project.id);
              }}
            />
          </div>
        </div>
      </ProjectCard>
    );
  };

  const renderProjectsView = () => (
    <div
      style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
        display: 'grid',
        gap: 'var(--space-md)',
      }}
    >
      {showApiTip && projects.length === 0 ? (
        <FeedbackBanner
          type="info"
          title="欢迎使用 MuMuAINovel"
          closable
          onClose={() => setShowApiTip(false)}
          description={
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 'var(--space-sm)',
                justifyContent: 'space-between',
              }}
            >
              <span>首次使用建议先完成 API 配置，然后开始创建项目。</span>
              <Button type="primary" size="small" onClick={() => navigateToView('settings')}>
                去配置
              </Button>
            </div>
          }
        />
      ) : null}

      <SectionBlock
        title="项目书架"
        description="快速进入项目、导入导出备份，统一管理你的创作资产。"
        actions={
          <Button type="primary" onClick={() => navigate('/wizard')}>
            新建项目
          </Button>
        }
      >
        <Spin spinning={loading}>
          <ProjectGrid>
            <QuickStartCard onStart={() => navigate('/wizard')} onInspiration={() => navigate('/inspiration')} />
            {projects.map((project) => renderProjectCard(project))}
          </ProjectGrid>

          {projects.length === 0 ? (
            <div
              style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-border)',
                background: 'var(--color-bg-layout)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              还没有项目，点击“快速开始”创建你的第一本小说。
            </div>
          ) : null}
        </Spin>
      </SectionBlock>
    </div>
  );

  const renderCurrentView = () => {
    if (activeView === 'settings') return <SettingsPage />;
    if (activeView === 'mcp') return <MCPPluginsPage />;
    if (activeView === 'prompts') return <PromptTemplates />;
    return renderProjectsView();
  };

  return (
    <>
      {contextHolder}

      <AppShell
        title={viewMeta.title}
        subtitle={viewMeta.subtitle}
        menuItems={PROJECT_MENU_ITEMS}
        selectedMenuKey={activeView}
        onMenuSelect={(key) => {
          if (isProjectListView(key)) {
            navigateToView(key);
          }
        }}
        sidebarWidth={220}
        collapsedWidth={64}
        rightHeaderActions={headerActions}
        headerMetrics={headerMetrics}
        siderBrand={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
            }}
          >
            <BookOutlined style={{ color: 'var(--color-primary)' }} />
            <span>MuMuAINovel</span>
          </div>
        }
        siderFooter={<UserMenu showFullInfo />}
        contentPadding="var(--space-sm)"
      >
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {renderCurrentView()}
          <ChangelogFloatingButton />
        </div>
      </AppShell>

      <ImportModal
        title="导入项目"
        open={importModalVisible}
        loading={importing}
        onCancel={handleCloseImportModal}
        onOk={handleImport}
        okText="导入"
        cancelText="取消"
        width={isMobile ? '92%' : 560}
        okButtonProps={{ disabled: !validationResult?.valid }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">选择导出的 JSON 备份文件，系统会校验后再执行导入。</Text>

          <Upload
            accept=".json"
            beforeUpload={handleFileSelect}
            maxCount={1}
            fileList={importFileList}
            onRemove={() => {
              setSelectedFile(null);
              setValidationResult(null);
            }}
          >
            <Button icon={<UploadOutlined />} block>
              选择文件
            </Button>
          </Upload>

          {validating ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
              <Spin tip="校验备份文件中..." />
            </div>
          ) : null}

          {validationResult ? (
            <div
              style={{
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                background: validationResult.valid ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                display: 'grid',
                gap: 'var(--space-sm)',
              }}
            >
              <StatusBadge intent={validationResult.valid ? 'success' : 'default'}>
                {validationResult.valid ? '文件校验通过' : '文件校验失败'}
              </StatusBadge>

              {validationResult.project_name ? (
                <Text>
                  <Text type="secondary">项目名称：</Text>
                  <Text strong>{validationResult.project_name}</Text>
                </Text>
              ) : null}

              {visibleBackupStats.length ? (
                <Space size={[6, 6]} wrap>
                  {visibleBackupStats.map((item) => {
                    const value = validationResult.statistics[item.key];
                    if (typeof value === 'boolean') {
                      return (
                        <Tag key={item.key} color="success" style={{ margin: 0 }}>
                          含默认风格
                        </Tag>
                      );
                    }
                    return (
                      <Tag key={item.key} color={item.color} style={{ margin: 0 }}>
                        {item.label}: {value}
                      </Tag>
                    );
                  })}
                </Space>
              ) : null}

              {validationResult.warnings.length ? (
                <div>
                  <Text type="warning">提示：</Text>
                  <ul style={{ margin: 'var(--space-xs) 0 0', paddingInlineStart: 20 }}>
                    {validationResult.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {validationResult.errors.length ? (
                <div>
                  <Text type="danger">错误：</Text>
                  <ul style={{ margin: 'var(--space-xs) 0 0', paddingInlineStart: 20 }}>
                    {validationResult.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </Space>
      </ImportModal>

      <ExportModal
        title="导出项目"
        open={exportModalVisible}
        loading={exporting}
        onCancel={handleCloseExportModal}
        onOk={handleExport}
        okText={selectedProjectIds.length ? `导出 (${selectedProjectIds.length})` : '导出'}
        cancelText="取消"
        width={isMobile ? '92%' : 720}
        okButtonProps={{ disabled: selectedProjectIds.length === 0 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="u-flex-between">
            <Text strong>选择要导出的项目（{exportableProjects.length}）</Text>
            <Checkbox
              checked={selectedProjectIds.length === exportableProjects.length && exportableProjects.length > 0}
              indeterminate={
                selectedProjectIds.length > 0 && selectedProjectIds.length < exportableProjects.length
              }
              onChange={handleToggleAll}
            >
              全选
            </Checkbox>
          </div>

          <div
            style={{
              maxHeight: '360px',
              overflowY: 'auto',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-xs)',
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {exportableProjects.map((project) => {
                const progress = getProgress(project.current_words || 0, project.target_words || 0);
                const status = getDisplayStatus(project.status, progress);
                const statusConfig = PROJECT_STATUS_META[status];
                const checked = selectedProjectIds.includes(project.id);

                return (
                  <div
                    key={project.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggleProject(project.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleToggleProject(project.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: checked
                        ? '1px solid var(--color-primary)'
                        : '1px solid transparent',
                      background: checked ? 'var(--color-info-bg)' : 'transparent',
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => handleToggleProject(project.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="u-truncate"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {project.title}
                      </div>
                      <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        已写 {formatWordCount(project.current_words || 0)} 字
                      </Text>
                    </div>
                    <StatusBadge intent={statusConfig.intent} icon={statusConfig.icon}>
                      {statusConfig.label}
                    </StatusBadge>
                  </div>
                );
              })}
            </Space>
          </div>
        </Space>
      </ExportModal>
    </>
  );
}
