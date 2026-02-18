import { useEffect, useState } from 'react';
import { Button, Modal, Space } from 'antd';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onDoNotShowToday: () => void;
  onNeverShow: () => void;
}

function QrBlock({
  title,
  src,
  alt,
  failed,
  onError,
}: {
  title: string;
  src: string;
  alt: string;
  failed: boolean;
  onError: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200 }}>
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>{title}</p>
      {failed ? (
        <div
          className="u-flex-center"
          style={{
            width: 180,
            height: 180,
            background: 'var(--color-bg-container)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          二维码加载失败
        </div>
      ) : (
        <div
          className="u-flex-center"
          style={{
            background: 'var(--color-bg-container)',
            borderRadius: 'var(--radius-md)',
            padding: 6,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{ width: 180, height: 180, objectFit: 'contain', display: 'block' }}
            onError={onError}
          />
        </div>
      )}
    </div>
  );
}

export default function AnnouncementModal({
  visible,
  onClose,
  onDoNotShowToday,
  onNeverShow,
}: AnnouncementModalProps) {
  const [qqImageError, setQqImageError] = useState(false);
  const [wxImageError, setWxImageError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQqImageError(false);
    setWxImageError(false);
  }, [visible]);

  const handleDoNotShowToday = () => {
    onDoNotShowToday();
    onClose();
  };

  const handleNeverShow = () => {
    onNeverShow();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={700}
      centered
      title={
        <div style={{ textAlign: 'center', color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
          欢迎使用 AI 小说创作助手
        </div>
      }
      footer={
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button onClick={handleDoNotShowToday}>今日内不再显示</Button>
          <Button type="primary" onClick={handleNeverShow}>
            永不再显示
          </Button>
        </Space>
      }
      styles={{
        body: { padding: 'var(--space-lg)', background: 'var(--color-bg-container)' },
        header: {
          background: 'linear-gradient(120deg, var(--color-info-bg), var(--color-bg-container))',
          borderBottom: '1px solid var(--color-border-secondary)',
          padding: 'var(--space-md) var(--space-lg)',
        },
        footer: {
          background: 'var(--color-bg-container)',
          borderTop: '1px solid var(--color-border-secondary)',
          padding: 'var(--space-md) var(--space-lg)',
        },
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}>欢迎加入交流群，在这里你可以：</p>
          <ul style={{ textAlign: 'left', margin: '0 auto var(--space-md)', maxWidth: 420 }}>
            <li>交流创作思路与实践</li>
            <li>获取最新功能更新和使用技巧</li>
            <li>反馈问题与建议</li>
            <li>分享你的创作成果</li>
          </ul>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 0 }}>扫描下方二维码加入社群</p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'var(--color-bg-layout)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
          }}
        >
          <QrBlock title="QQ 交流群" src="/qq.jpg" alt="QQ 交流群二维码" failed={qqImageError} onError={() => setQqImageError(true)} />
          <QrBlock title="微信交流群" src="/WX.png" alt="微信 交流群二维码" failed={wxImageError} onError={() => setWxImageError(true)} />
        </div>

        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm)',
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-warning)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          提示：“今日内不再显示”仅当天生效，“永不再显示”会长期隐藏本公告。
        </div>
      </div>
    </Modal>
  );
}
