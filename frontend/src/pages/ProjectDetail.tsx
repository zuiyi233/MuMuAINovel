import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { Button, Select, Space, Typography, message } from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  BookOutlined,
  GlobalOutlined,
  ApartmentOutlined,
  BankOutlined,
  EditOutlined,
  FundOutlined,
  HeartOutlined,
  TrophyOutlined,
  BulbOutlined,
  CloudOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { AppShell } from '../components/layout';
import { MetricPill } from '../components/ui';
import { ProjectSkillModal } from '../components/project-detail';
import { LoadingState } from '../components/common';
import { useStore } from '../store';
import { useCharacterSync, useOutlineSync, useChapterSync } from '../store/hooks';
import { projectApi, skillsApi } from '../services/api';
import type { SkillSpecResponse } from '../types';

const { Text } = Typography;

type ProjectMenuKey =
  | 'sponsor'
  | 'world-setting'
  | 'careers'
  | 'characters'
  | 'relationships'
  | 'organizations'
  | 'outline'
  | 'chapters'
  | 'chapter-analysis'
  | 'foreshadows'
  | 'writing-styles'
  | 'prompt-workshop';

const projectMenu = [
  { key: 'sponsor', path: 'sponsor', icon: <HeartOutlined />, label: '赞助支持' },
  { key: 'world-setting', path: 'world-setting', icon: <GlobalOutlined />, label: '世界设定' },
  { key: 'careers', path: 'careers', icon: <TrophyOutlined />, label: '职业管理' },
  { key: 'characters', path: 'characters', icon: <TeamOutlined />, label: '角色管理' },
  { key: 'relationships', path: 'relationships', icon: <ApartmentOutlined />, label: '关系管理' },
  { key: 'organizations', path: 'organizations', icon: <BankOutlined />, label: '组织管理' },
  { key: 'outline', path: 'outline', icon: <FileTextOutlined />, label: '大纲管理' },
  { key: 'chapters', path: 'chapters', icon: <BookOutlined />, label: '章节管理' },
  { key: 'chapter-analysis', path: 'chapter-analysis', icon: <FundOutlined />, label: '剧情分析' },
  { key: 'foreshadows', path: 'foreshadows', icon: <BulbOutlined />, label: '伏笔管理' },
  { key: 'writing-styles', path: 'writing-styles', icon: <EditOutlined />, label: '写作风格' },
  { key: 'prompt-workshop', path: 'prompt-workshop', icon: <CloudOutlined />, label: '提示词工坊' },
] as const satisfies Array<{ key: ProjectMenuKey; path: string; icon: JSX.Element; label: string }>;

const resolveSelectedMenuKey = (pathname: string): ProjectMenuKey => {
  if (pathname.includes('/world-setting')) return 'world-setting';
  if (pathname.includes('/careers')) return 'careers';
  if (pathname.includes('/relationships')) return 'relationships';
  if (pathname.includes('/organizations')) return 'organizations';
  if (pathname.includes('/outline')) return 'outline';
  if (pathname.includes('/characters')) return 'characters';
  if (pathname.includes('/chapter-analysis')) return 'chapter-analysis';
  if (pathname.includes('/foreshadows')) return 'foreshadows';
  if (pathname.includes('/chapters')) return 'chapters';
  if (pathname.includes('/writing-styles')) return 'writing-styles';
  if (pathname.includes('/prompt-workshop')) return 'prompt-workshop';
  return 'sponsor';
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skills, setSkills] = useState<SkillSpecResponse[]>([]);

  const {
    currentProject,
    setCurrentProject,
    clearProjectData,
    loading,
    setLoading,
    outlines,
    characters,
    chapters,
  } = useStore();

  const { refreshCharacters } = useCharacterSync();
  const { refreshOutlines } = useOutlineSync();
  const { refreshChapters } = useChapterSync();

  useEffect(() => {
    const loadProjectData = async (id: string) => {
      try {
        setLoading(true);
        const project = await projectApi.getProject(id);
        setCurrentProject(project);
        await Promise.all([refreshOutlines(id), refreshCharacters(id), refreshChapters(id)]);
      } catch (error) {
        console.error('加载项目数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      void loadProjectData(projectId);
    }

    return () => {
      clearProjectData();
    };
  }, [projectId, clearProjectData, refreshCharacters, refreshChapters, refreshOutlines, setCurrentProject, setLoading]);

  const selectedMenuKey = useMemo(() => resolveSelectedMenuKey(location.pathname), [location.pathname]);

  const menuItems = useMemo(
    () =>
      projectMenu.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      })),
    [],
  );

  const activeProjectSkillKey = currentProject?.active_skill_key ?? null;

  const loadSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await skillsApi.list();
      setSkills(res.items || []);
    } finally {
      setSkillsLoading(false);
    }
  };

  const openSkillModal = async () => {
    setSkillModalOpen(true);
    if (!skills.length) {
      await loadSkills();
    }
  };

  const updateProjectSkill = async (next: string) => {
    if (!projectId) return;
    const nextKey = next === '__none__' ? null : next;
    setSkillsLoading(true);
    try {
      const updated = await projectApi.updateProject(projectId, { active_skill_key: nextKey });
      setCurrentProject(updated);
      message.success(nextKey ? '已设置项目技能（覆盖用户技能）' : '已清空项目技能（回退到用户技能）');
    } finally {
      setSkillsLoading(false);
    }
  };

  if (loading || !currentProject) {
    return <LoadingState tip="加载项目中..." />;
  }

  const headerMetrics = (
    <Space size="small" wrap>
      <MetricPill label="大纲" value={`${outlines.length} 条`} />
      <MetricPill label="角色" value={`${characters.length} 个`} />
      <MetricPill label="章节" value={`${chapters.length} 章`} />
      <MetricPill label="已写" value={`${currentProject.current_words} 字`} tone="primary" />
    </Space>
  );

  return (
    <>
      <AppShell
        title={currentProject.title}
        subtitle="项目工作台"
        menuItems={menuItems}
        selectedMenuKey={selectedMenuKey}
        onMenuSelect={(key) => {
          if (!projectId) return;
          navigate(`/project/${projectId}/${key}`);
        }}
        sidebarWidth={220}
        collapsedWidth={60}
        leftHeaderActions={
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: 'var(--color-bg-container)' }}
          >
            返回主页
          </Button>
        }
        rightHeaderActions={
          <Button
            icon={<SettingOutlined />}
            onClick={openSkillModal}
            style={{
              color: 'var(--color-bg-container)',
              borderColor: 'var(--color-bg-container)',
              background: 'transparent',
            }}
          >
            项目技能
          </Button>
        }
        headerMetrics={headerMetrics}
        contentPadding="var(--space-sm)"
      >
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </AppShell>

      <ProjectSkillModal open={skillModalOpen} onClose={() => setSkillModalOpen(false)}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Select
            value={activeProjectSkillKey ?? '__none__'}
            onChange={updateProjectSkill}
            loading={skillsLoading}
            style={{ width: '100%' }}
            options={[
              { value: '__none__', label: '不设置（使用用户技能）' },
              ...skills.map((s) => ({ value: s.skill_key, label: s.name })),
            ]}
            showSearch
            optionFilterProp="label"
          />
          <Text type="secondary">设置后，该项目下的 AI 调用会优先使用项目技能；如不设置，将回退使用“设置页”中的用户技能。</Text>
          <Text type="secondary">技能列表来自技能规范同步结果（.opencode/skills）。如果看不到新技能，请先在“设置-技能”中点击同步。</Text>
        </Space>
      </ProjectSkillModal>
    </>
  );
}
