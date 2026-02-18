import { useEffect, useState } from 'react';
import { Form, Input, Spin, Tabs, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import AnnouncementModal from '../components/AnnouncementModal';

const { Paragraph } = Typography;

// ─── 装饰性光晕球（模拟 macOS 壁纸光晕效果）─── //
function GlowOrb({
  color,
  size,
  top,
  left,
  right,
  bottom,
  opacity = 0.28,
  blur = 80,
}: {
  color: string;
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  blur?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        opacity,
        filter: `blur(${blur}px)`,
        top,
        left,
        right,
        bottom,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [localAuthEnabled, setLocalAuthEnabled] = useState(false);
  const [linuxdoEnabled, setLinuxdoEnabled] = useState(false);
  const [form] = Form.useForm();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.getCurrentUser();
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect);
      } catch {
        try {
          const config = await authApi.getAuthConfig();
          setLocalAuthEnabled(config.local_auth_enabled);
          setLinuxdoEnabled(config.linuxdo_enabled);
        } catch (error) {
          console.error('获取认证配置失败:', error);
          setLinuxdoEnabled(true);
        }
        setChecking(false);
      }
    };
    void checkAuth();
  }, [navigate, searchParams]);

  const handleLocalLogin = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const response = await authApi.localLogin(values.username, values.password);
      if (response.success) {
        message.success('登录成功！');
        const hideForever = localStorage.getItem('announcement_hide_forever');
        const hideToday = localStorage.getItem('announcement_hide_today');
        const today = new Date().toDateString();
        if (hideForever === 'true' || hideToday === today) {
          const redirect = searchParams.get('redirect') || '/';
          navigate(redirect);
        } else {
          setShowAnnouncement(true);
        }
      }
    } catch (error) {
      console.error('本地登录失败:', error);
      setLoading(false);
    }
  };

  const handleLinuxDOLogin = async () => {
    try {
      setLoading(true);
      const response = await authApi.getLinuxDOAuthUrl();
      const redirect = searchParams.get('redirect');
      if (redirect) {
        sessionStorage.setItem('login_redirect', redirect);
      }
      window.location.href = response.auth_url;
    } catch (error) {
      console.error('获取授权地址失败:', error);
      message.error('获取授权地址失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleAnnouncementClose = () => {
    setShowAnnouncement(false);
    const redirect = searchParams.get('redirect') || '/';
    navigate(redirect);
  };

  const handleDoNotShowToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('announcement_hide_today', today);
  };

  const handleNeverShow = () => {
    localStorage.setItem('announcement_hide_forever', 'true');
  };

  // ─── 加载中状态 ─── //
  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // ─── 本地账户密码登录表单 ─── //
  const renderLocalLogin = () => (
    <Form form={form} onFinish={handleLocalLogin} size="large" style={{ marginTop: 4 }}>
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input
          prefix={
            <UserOutlined
              style={{
                color: 'var(--color-text-quaternary)',
                marginRight: 2,
                fontSize: 15,
              }}
            />
          }
          placeholder="用户名"
          autoComplete="username"
          style={{ height: 44 }}
        />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password
          prefix={
            <LockOutlined
              style={{
                color: 'var(--color-text-quaternary)',
                marginRight: 2,
                fontSize: 15,
              }}
            />
          }
          placeholder="密码"
          autoComplete="current-password"
          style={{ height: 44 }}
        />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0, marginTop: 20 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: 46,
            border: 'none',
            borderRadius: 10,
            /* Apple 蓝色渐变 Primary Button */
            background: loading
              ? 'rgba(10, 132, 255, 0.5)'
              : 'linear-gradient(180deg, #1a8cff 0%, #0070e0 100%)',
            boxShadow: loading
              ? 'none'
              : 'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.14), 0 4px 16px -6px rgba(10,132,255,0.72), 0 8px 28px -10px rgba(10,132,255,0.44)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 0.01,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition:
              'transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 180ms cubic-bezier(0.22,1,0.36,1)',
            fontFamily: 'var(--font-family-sans)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background =
                'linear-gradient(180deg, #3d9eff 0%, #1a8cff 100%)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = loading
              ? 'rgba(10, 132, 255, 0.5)'
              : 'linear-gradient(180deg, #1a8cff 0%, #0070e0 100%)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
        >
          {loading ? <Spin size="small" /> : null}
          {loading ? '登录中...' : '登录'}
        </button>
      </Form.Item>
    </Form>
  );

  // ─── LinuxDO OAuth 登录 ─── //
  const renderLinuxDOLogin = () => (
    <div style={{ paddingTop: 8 }}>
      <button
        type="button"
        onClick={handleLinuxDOLogin}
        disabled={loading}
        style={{
          width: '100%',
          height: 50,
          border: 'none',
          borderRadius: 10,
          background: loading
            ? 'rgba(10, 132, 255, 0.5)'
            : 'linear-gradient(180deg, #1a8cff 0%, #0070e0 100%)',
          boxShadow: loading
            ? 'none'
            : 'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.14), 0 4px 16px -6px rgba(10,132,255,0.72), 0 8px 28px -10px rgba(10,132,255,0.44)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition:
            'transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 180ms cubic-bezier(0.22,1,0.36,1)',
          fontFamily: 'var(--font-family-sans)',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow =
              'inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -1px 0 rgba(0,0,0,0.14), 0 6px 24px -4px rgba(10,132,255,0.8), 0 12px 36px -10px rgba(10,132,255,0.56)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = loading
            ? 'none'
            : 'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.14), 0 4px 16px -6px rgba(10,132,255,0.72), 0 8px 28px -10px rgba(10,132,255,0.44)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.97)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
      >
        {loading ? (
          <Spin size="small" />
        ) : (
          <img
            src="/favicon.ico"
            alt=""
            style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }}
          />
        )}
        {loading ? '跳转中...' : '使用 LinuxDO 账户登录'}
      </button>
    </div>
  );

  // ─── 登录方式决策 ─── //
  const loginContent =
    localAuthEnabled && linuxdoEnabled ? (
      <Tabs
        defaultActiveKey="local"
        centered
        size="small"
        items={[
          { key: 'local', label: '账户密码', children: renderLocalLogin() },
          { key: 'linuxdo', label: 'LinuxDO', children: renderLinuxDOLogin() },
        ]}
      />
    ) : localAuthEnabled ? (
      renderLocalLogin()
    ) : (
      renderLinuxDOLogin()
    );

  return (
    <>
      <AnnouncementModal
        visible={showAnnouncement}
        onClose={handleAnnouncementClose}
        onDoNotShowToday={handleDoNotShowToday}
        onNeverShow={handleNeverShow}
      />

      {/* ─── 全屏容器 ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ─── 背景装饰光晕 ─── */}
        <GlowOrb
          color="radial-gradient(circle, #4d94ff, #0a84ff)"
          size={520}
          top="-14%"
          right="-8%"
          opacity={0.22}
          blur={90}
        />
        <GlowOrb
          color="radial-gradient(circle, #30d158, #28a745)"
          size={380}
          bottom="-12%"
          left="-6%"
          opacity={0.16}
          blur={80}
        />
        <GlowOrb
          color="radial-gradient(circle, #5ac8fa, #007aff)"
          size={280}
          top="60%"
          right="8%"
          opacity={0.14}
          blur={70}
        />

        {/* 
          ─── 登录卡片（主体）───
          应用完整 macOS 玻璃材质系统：
          - Thick Material: backdrop-blur + saturate
          - 顶部内高光（bezel 效果）
          - 0.5px hairline 边框
          - 噪声纹理（内联 SVG）
          - 多层叠加阴影
        */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            position: 'relative',
            zIndex: 1,
            borderRadius: 20,
            overflow: 'hidden',
            border: '0.5px solid rgba(0,0,0,0.09)',
            background: 'rgba(253,254,255,0.88)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.76),
              0 0 0 0.5px rgba(0,0,0,0.06),
              0 0 1px rgba(0,0,0,0.32),
              0 8px 32px rgba(0,0,0,0.08),
              0 32px 80px -20px rgba(10,22,45,0.26)
            `,
          }}
        >
          {/* 噪声纹理覆盖层 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.016,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: '200px 200px',
            }}
          />

          {/* ─── 卡片内容区 ─── */}
          <div style={{ padding: '40px 36px 36px', position: 'relative', zIndex: 1 }}>
            {/* ─── Logo 区域 ─── */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {/* App Icon：圆角矩形 + 蓝色渐变 */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: '0 auto 16px',
                  borderRadius: 18,
                  background: 'linear-gradient(145deg, #2d9bff 0%, #0070e0 60%, #0058c4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.36),
                    inset 0 -1px 0 rgba(0,0,0,0.18),
                    0 4px 12px rgba(10,132,255,0.36),
                    0 12px 36px -8px rgba(10,132,255,0.56)
                  `,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* App Icon 内反光 */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: '18px 18px 0 0',
                  }}
                />
                <img
                  src="/logo.svg"
                  alt="MuMuAINovel"
                  style={{
                    width: 44,
                    height: 44,
                    filter: 'brightness(0) invert(1)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* 标题 */}
              <h1
                style={{
                  margin: '0 0 6px',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: -0.4,
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-sans)',
                  lineHeight: 1.2,
                }}
              >
                AI 小说创作助手
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: 0.01,
                  lineHeight: 1.5,
                }}
              >
                {localAuthEnabled && linuxdoEnabled
                  ? '选择你的登录方式'
                  : localAuthEnabled
                    ? '使用账户密码登录'
                    : '使用 LinuxDO 账户登录'}
              </p>
            </div>

            {/* ─── 分隔线 ─── */}
            <div
              aria-hidden
              style={{
                height: '0.5px',
                background: 'rgba(0,0,0,0.07)',
                margin: '0 0 24px',
              }}
            />

            {/* ─── 登录方式 ─── */}
            <div>{loginContent}</div>

            {/* ─── 底部提示信息 ─── */}
            <div
              style={{
                marginTop: 24,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(10,132,255,0.06)',
                border: '0.5px solid rgba(10,132,255,0.14)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Paragraph
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.65,
                  letterSpacing: 0.01,
                }}
              >
                🎉 首次登录将自动创建账号
                <br />
                🔒 每个用户拥有独立的隔离数据空间
              </Paragraph>
            </div>
          </div>

          {/* ─── 底部版权栏 ─── */}
          <div
            style={{
              padding: '10px 36px',
              borderTop: '0.5px solid rgba(0,0,0,0.06)',
              background: 'rgba(0,0,0,0.02)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-quaternary)',
                letterSpacing: 0.01,
              }}
            >
              MuMuAINovel · AI 驱动的智能小说创作平台
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
