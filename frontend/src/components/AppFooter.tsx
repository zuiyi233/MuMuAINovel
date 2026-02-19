import { useEffect, useState } from 'react';
import { Badge, Button, Divider, Grid, Space, Typography } from 'antd';
import { ClockCircleOutlined, CopyrightOutlined, GiftOutlined, GithubOutlined, HeartFilled } from '@ant-design/icons';
import { VERSION_INFO, getVersionString } from '../config/version';
import { checkLatestVersion } from '../services/versionService';

const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

interface AppFooterProps {
  sidebarWidth?: number;
}

export default function AppFooter({ sidebarWidth = 0 }: AppFooterProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [releaseUrl, setReleaseUrl] = useState('');

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const result = await checkLatestVersion();
        setHasUpdate(result.hasUpdate);
        setLatestVersion(result.latestVersion);
        setReleaseUrl(result.releaseUrl);
      } catch {
        // Ignore version check errors in footer.
      }
    };

    const timer = setTimeout(checkVersion, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleVersionClick = () => {
    if (hasUpdate && releaseUrl) {
      window.open(releaseUrl, '_blank');
    }
  };

  const leftOffset = isMobile ? 0 : sidebarWidth;

  const versionNode = (
    <Badge dot={hasUpdate} offset={[-6, 2]}>
      <button
        type="button"
        onClick={handleVersionClick}
        title={hasUpdate ? `发现新版本 v${latestVersion}，点击查看` : '当前版本'}
        style={{
          cursor: hasUpdate ? 'pointer' : 'default',
          border: 'none',
          background: 'transparent',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <strong style={{ color: 'var(--color-text-primary)' }}>{VERSION_INFO.projectName}</strong>
        <span>{getVersionString()}</span>
      </button>
    </Badge>
  );

  const sponsorButton = (
    <Button
      type={isMobile ? 'text' : 'primary'}
      icon={<GiftOutlined />}
      onClick={() => window.open('https://mumuverse.space:1588/', '_blank')}
      style={
        isMobile
          ? {
              color: 'var(--color-text-secondary)',
            }
          : {
              background: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              boxShadow: 'var(--shadow-primary)',
            }
      }
    >
      {isMobile ? '赞助' : '赞助支持'}
    </Button>
  );

  return (
    <footer
      style={{
        position: 'fixed',
        left: leftOffset,
        right: 0,
        bottom: 0,
        zIndex: 100,
        borderTop: '1px solid var(--color-border-light)',
        boxShadow: 'var(--shadow-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'color-mix(in srgb, var(--color-bg-container) 86%, transparent)',
        padding: isMobile ? 'var(--space-xs) var(--space-sm)' : 'var(--space-xs) var(--space-md)',
        transition: 'left var(--motion-duration-base) var(--motion-easing-standard)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', textAlign: 'center' }}>
        {isMobile ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              flexWrap: 'wrap',
            }}
          >
            {versionNode}
            <Divider type="vertical" style={{ marginInline: 4 }} />
            {sponsorButton}
            <Divider type="vertical" style={{ marginInline: 4 }} />
            <Link href={VERSION_INFO.githubUrl} target="_blank" rel="noopener noreferrer">
              <GithubOutlined />
            </Link>
            <Text style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {VERSION_INFO.buildTime}
            </Text>
          </div>
        ) : (
          <Space
            size="middle"
            split={<Divider type="vertical" style={{ borderColor: 'var(--color-border-light)' }} />}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {versionNode}

            <Link
              href={VERSION_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
            >
              <GithubOutlined />
              <span>GitHub</span>
            </Link>

            <Link href={VERSION_INFO.linuxDoUrl} target="_blank" rel="noopener noreferrer">
              LinuxDO 社区
            </Link>

            {sponsorButton}

            <Link
              href={VERSION_INFO.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)' }}
            >
              <CopyrightOutlined />
              <span>{VERSION_INFO.license}</span>
            </Link>

            <Text style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-tertiary)' }}>
              <ClockCircleOutlined />
              <span>{VERSION_INFO.buildTime}</span>
            </Text>

            <Text style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)' }}>
              <span>Made with</span>
              <HeartFilled style={{ color: 'var(--color-error)' }} />
              <span>{VERSION_INFO.author}</span>
            </Text>
          </Space>
        )}
      </div>
    </footer>
  );
}
