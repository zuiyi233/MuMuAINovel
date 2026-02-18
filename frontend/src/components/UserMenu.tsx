import { useEffect, useState } from 'react';
import { Avatar, Button, Dropdown, Form, Input, Modal, Space, Typography, message } from 'antd';
import { CrownOutlined, LockOutlined, LogoutOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import type { User } from '../types';

const { Text } = Typography;

interface UserMenuProps {
  // 在移动端侧栏中可强制显示完整信息
  showFullInfo?: boolean;
}

export default function UserMenu({ showFullInfo = false }: UserMenuProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordForm] = Form.useForm<{ newPassword: string; confirmPassword: string }>();

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    void loadCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      message.success('已退出登录');
      window.location.href = '/login';
    } catch (error) {
      console.error('退出登录失败:', error);
      message.error('退出登录失败');
    }
  };

  const handleShowUserManagement = () => {
    if (!currentUser?.is_admin) {
      message.warning('仅管理员可访问用户管理');
      return;
    }
    navigate('/user-management');
  };

  const handleChangePassword = async (values: { newPassword: string }) => {
    try {
      setChangingPassword(true);
      await authApi.setPassword(values.newPassword);
      message.success('密码修改成功');
      setShowChangePassword(false);
      changePasswordForm.resetFields();
    } catch (error: unknown) {
      console.error('修改密码失败:', error);
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || '修改密码失败');
    } finally {
      setChangingPassword(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: 'var(--space-xs) 0' }}>
          <Text strong>{currentUser?.display_name || currentUser?.username}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
            Trust Level: {currentUser?.trust_level}
            {currentUser?.is_admin ? ' · 管理员' : ''}
          </Text>
        </div>
      ),
    },
    { type: 'divider' },
    ...(currentUser?.is_admin
      ? [
          {
            key: 'user-management',
            icon: <TeamOutlined />,
            label: '用户管理',
            onClick: handleShowUserManagement,
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setShowChangePassword(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  if (!currentUser) {
    return null;
  }

  const userName = currentUser.display_name || currentUser.username;

  return (
    <>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
        <button
          type="button"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            width: '100%',
            padding: 'var(--space-xs) var(--space-sm)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-border-light)',
            background: 'var(--color-bg-container)',
            boxShadow: 'var(--shadow-card)',
            transition:
              'transform var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Avatar
              src={currentUser.avatar_url}
              icon={<UserOutlined />}
              style={{
                backgroundColor: 'var(--color-primary)',
                border: '2px solid var(--color-bg-container)',
                boxShadow: 'var(--shadow-card)',
              }}
            />
            {currentUser.is_admin ? (
              <span
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: -4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-warning)',
                  color: 'var(--color-bg-container)',
                  border: '1px solid var(--color-bg-container)',
                }}
              >
                <CrownOutlined style={{ fontSize: 9 }} />
              </span>
            ) : null}
          </div>

          <Space
            direction="vertical"
            size={0}
            style={{
              display: window.innerWidth <= 768 && !showFullInfo ? 'none' : 'flex',
              minWidth: 0,
              alignItems: 'flex-start',
            }}
          >
            <Text className="u-truncate" strong style={{ maxWidth: 140, color: 'var(--color-text-primary)' }}>
              {userName}
            </Text>
            <Text style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              {currentUser.is_admin ? '管理员' : `Trust Level ${currentUser.trust_level}`}
            </Text>
          </Space>
        </button>
      </Dropdown>

      <Modal
        title="修改密码"
        open={showChangePassword}
        onCancel={() => {
          setShowChangePassword(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
        width={480}
        centered
      >
        <Form form={changePasswordForm} layout="vertical" onFinish={handleChangePassword} autoComplete="off">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少 6 个字符）" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" autoComplete="new-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowChangePassword(false);
                  changePasswordForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
