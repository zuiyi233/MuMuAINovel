import { useCallback, useEffect, useState } from 'react';
import { Card, Input, Button, message, Space, Grid, Row, Col, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { polishApi } from '../services/api';
import { PageHeader, SectionBlock } from '../components/ui';

const { TextArea } = Input;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function Polish() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [originalText, setOriginalText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePolish = useCallback(async () => {
    if (!originalText.trim()) {
      message.warning('请输入要去味的文本');
      return;
    }

    try {
      setLoading(true);
      const result = await polishApi.polishText({ text: originalText });
      setPolishedText(result.polished_text);
      message.success('AI去味完成');
    } catch {
      message.error('AI去味失败');
    } finally {
      setLoading(false);
    }
  }, [originalText]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(polishedText);
    message.success('已复制到剪贴板');
  }, [polishedText]);

  const handleClear = useCallback(() => {
    setOriginalText('');
    setPolishedText('');
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      if (!ctrlOrMeta) {
        return;
      }

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        void handlePolish();
      }

      if (event.key.toLowerCase() === 'c' && polishedText) {
        event.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [polishedText, handleCopy, handlePolish]);

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--color-bg-base)',
        padding: isMobile ? 'var(--space-md)' : 'var(--space-lg)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <PageHeader
          title="AI去味工具"
          subtitle="将 AI 生成文本优化为更自然、更具人类作者风格的表达。"
        />

        <SectionBlock>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card
              styles={{ body: { padding: isMobile ? '12px' : '16px' } }}
              style={{ borderRadius: 12 }}
            >
              <Space
                style={{ width: '100%', justifyContent: 'space-between' }}
                wrap
                size="middle"
              >
                    <Text style={{ color: 'var(--color-text-secondary)' }}>
                      快捷操作区：Ctrl+D 去味，Ctrl+C 复制结果
                    </Text>
                <Space>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handlePolish}
                    loading={loading}
                    style={{ minWidth: 96, minHeight: 44 }}
                  >
                    开始去味 (Ctrl+D)
                  </Button>
                  <Button onClick={handleClear} style={{ minWidth: 96, minHeight: 44 }}>
                    清空
                  </Button>
                  <Button onClick={handleCopy} disabled={!polishedText} style={{ minWidth: 96, minHeight: 44 }}>
                    复制结果 (Ctrl+C)
                  </Button>
                </Space>
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="原始文本" style={{ borderRadius: 12, height: '100%' }}>
                  <div style={{ maxWidth: '78ch', margin: '0 auto' }}>
                    <TextArea
                      rows={isMobile ? 12 : 16}
                      placeholder="粘贴或输入需要去味的文本..."
                      value={originalText}
                      onChange={(e) => setOriginalText(e.target.value)}
                      style={{ lineHeight: 1.65, fontSize: 16, scrollBehavior: 'smooth' }}
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="去味后文本" style={{ borderRadius: 12, height: '100%' }}>
                  <div style={{ maxWidth: '78ch', margin: '0 auto' }}>
                    <TextArea
                      rows={isMobile ? 12 : 16}
                      value={polishedText}
                      readOnly
                      placeholder="去味结果会显示在这里"
                      style={{ lineHeight: 1.7, fontSize: 16, scrollBehavior: 'smooth' }}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </Space>
        </SectionBlock>
      </div>
    </div>
  );
}
