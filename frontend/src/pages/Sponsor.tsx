import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Image, Divider, Modal, Button } from 'antd';
import {
    HeartOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    RocketOutlined,
    MessageOutlined,
    StarOutlined
} from '@ant-design/icons';
import { PageHeader, SectionBlock } from '../components/ui';
import { settingsApi } from '../services/api';

const { Title, Paragraph, Text } = Typography;

interface SponsorOption {
    amount: number | string;
    label: string;
    image: string;
    description: string;
}

interface SponsorBenefit {
    title: string;
    description: string;
}

interface SponsorDisplayConfig {
    pageTitle: string;
    pageSubtitle: string;
    introTitle: string;
    introDescription: string;
    benefits: SponsorBenefit[];
    options: SponsorOption[];
    thankYouTitle: string;
    thankYouDescription: string;
}

const defaultSponsorConfig: SponsorDisplayConfig = {
    pageTitle: '赞助喵喵小说家',
    pageSubtitle: 'SUPPORT AI NOVEL CREATION',
    introTitle: '📚 喵喵小说家 - 基于 AI 的智能小说创作助手',
    introDescription: '支持多AI模型、智能向导、角色管理、章节编辑等强大功能',
    benefits: [
        {
            title: '优先需求响应',
            description: '您的功能需求和问题反馈将获得优先处理'
        },
        {
            title: 'Windows一键启动',
            description: '获取免安装一键启动包，开箱即可使用'
        },
        {
            title: '专属技术支持',
            description: '加入赞助者群，获得远程协助和配置指导'
        }
    ],
    options: [
        { amount: 5, label: '🌶️ 一包辣条', image: '/5.png', description: '¥5' },
        { amount: 10, label: '🍱 一顿拼好饭', image: '/10.png', description: '¥10' },
        { amount: 20, label: '☕ 一杯咖啡', image: '/20.png', description: '¥20' },
        { amount: 50, label: '🍖 一次烧烤', image: '/50.png', description: '¥50' },
        { amount: 99, label: '🍲 一顿海底捞', image: '/99.png', description: '¥99' },
    ],
    thankYouTitle: '💖 感谢您对喵喵小说家的支持',
    thankYouDescription: '您的赞助将是项目持续更新的动力，为大家提供更好的 AI 小说创作体验'
};

const benefitIcons = [
    <FileTextOutlined style={{ fontSize: '32px', color: 'var(--color-primary)' }} />,
    <RocketOutlined style={{ fontSize: '32px', color: 'var(--color-success)' }} />,
    <MessageOutlined style={{ fontSize: '32px', color: 'var(--color-warning)' }} />,
];

export default function Sponsor() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SponsorOption | null>(null);
    const [displayConfig, setDisplayConfig] = useState<SponsorDisplayConfig>(defaultSponsorConfig);

    useEffect(() => {
        const loadSponsorConfig = async () => {
            try {
                const runtime = await settingsApi.getRuntimeConfig();
                const rawConfig = runtime?.sponsor_config;
                if (!rawConfig || rawConfig === '{sponsor_config}') {
                    return;
                }

                const parsed = JSON.parse(rawConfig) as Partial<SponsorDisplayConfig>;
                setDisplayConfig({
                    ...defaultSponsorConfig,
                    ...parsed,
                    benefits: parsed.benefits && parsed.benefits.length > 0 ? parsed.benefits : defaultSponsorConfig.benefits,
                    options: parsed.options && parsed.options.length > 0 ? parsed.options : defaultSponsorConfig.options,
                });
            } catch {
                setDisplayConfig(defaultSponsorConfig);
            }
        };

        void loadSponsorConfig();
    }, []);

    const handleCardClick = (option: SponsorOption) => {
        setSelectedOption(option);
        setModalVisible(true);
    };

    return (
        <div style={{
            minHeight: '100%',
            background: 'color-mix(in srgb, var(--color-bg-base) 92%, transparent)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            padding: 'var(--space-lg)'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                <PageHeader
                    title={displayConfig.pageTitle}
                    subtitle={displayConfig.pageSubtitle}
                />

                <SectionBlock>
                    <div style={{
                        marginBottom: 'clamp(20px, 4vh, 32px)',
                        padding: 'clamp(12px, 2vh, 16px)',
                        background: 'color-mix(in srgb, var(--color-primary) 88%, white 12%)',
                        borderRadius: '12px',
                        color: '#fff',
                        textAlign: 'center',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px -10px rgba(0,0,0,0.25)',
                        border: '0.5px solid rgba(255,255,255,0.2)'
                    }}>
                        <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>
                            {displayConfig.introTitle}
                        </Title>
                        <Paragraph style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                            {displayConfig.introDescription}
                        </Paragraph>
                    </div>

                    {/* 赞助专属权益 */}
                    <div style={{ marginBottom: 'clamp(24px, 4vh, 32px)' }}>
                        <Title level={3} style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3vh, 20px)', fontSize: 'clamp(18px, 3vw, 24px)' }}>
                            <CheckCircleOutlined style={{ color: 'var(--color-success)', marginRight: '8px' }} />
                            赞助专属权益
                        </Title>

                        <Row gutter={[{ xs: 8, sm: 12, md: 16 }, { xs: 8, sm: 12, md: 16 }]}>
                            {displayConfig.benefits.map((benefit, index) => (
                                <Col xs={24} md={8} key={index}>
                                    <Card
                                        hoverable
                                        style={{
                                            height: '100%',
                                            textAlign: 'center',
                                            borderRadius: '10px',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 0 0 1px rgba(0,0,0,0.05), 0 12px 28px -14px rgba(0,0,0,0.25)',
                                            border: '0.5px solid rgba(255,255,255,0.2)',
                                            background: 'color-mix(in srgb, var(--color-bg-container) 88%, transparent)',
                                            backdropFilter: 'blur(14px) saturate(130%)',
                                            WebkitBackdropFilter: 'blur(14px) saturate(130%)'
                                        }}
                                        styles={{
                                            body: { padding: 'clamp(16px, 3vh, 20px) clamp(12px, 2vw, 16px)' }
                                        }}
                                    >
                                        <div style={{ marginBottom: '12px' }}>
                                            {benefitIcons[index] || benefitIcons[0]}
                                        </div>
                                        <Title level={5} style={{ marginBottom: '8px', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>{benefit.title}</Title>
                                        <Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 0, fontSize: 'clamp(12px, 2vw, 13px)' }}>
                                            {benefit.description}
                                        </Paragraph>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    {/* 选择金额 */}
                    <div style={{ marginBottom: 'clamp(24px, 4vh, 32px)' }}>
                        <Title level={3} style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3vh, 20px)', fontSize: 'clamp(18px, 3vw, 24px)' }}>
                            <HeartOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
                            选择金额
                        </Title>

                        <Row gutter={[{ xs: 8, sm: 12, md: 16 }, { xs: 8, sm: 12, md: 16 }]} justify="center">
                            {displayConfig.options.map((option, index) => (
                                <Col xs={12} sm={8} md={6} lg={6} xl={4} key={index}>
                                    <Card
                                        hoverable
                                        onClick={() => handleCardClick(option)}
                                        style={{
                                            textAlign: 'center',
                                            borderRadius: '10px',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(0,0,0,0.05), 0 14px 28px -14px rgba(0,0,0,0.28)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            border: '0.5px solid rgba(255,255,255,0.24)',
                                            background: 'color-mix(in srgb, var(--color-bg-container) 90%, transparent)',
                                            backdropFilter: 'blur(12px) saturate(130%)',
                                            WebkitBackdropFilter: 'blur(12px) saturate(130%)'
                                        }}
                                        styles={{
                                            body: { padding: 'clamp(16px, 3vh, 20px) clamp(10px, 2vw, 12px)' }
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                            e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.36), 0 0 0 1px rgba(10,132,255,0.24), 0 18px 38px -16px rgba(10,132,255,0.45)';
                                            e.currentTarget.style.borderColor = 'rgba(10,132,255,0.35)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(0,0,0,0.05), 0 14px 28px -14px rgba(0,0,0,0.28)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)';
                                        }}
                                    >
                                        <Title level={3} style={{
                                            color: 'var(--color-primary)',
                                            marginBottom: '4px',
                                            fontSize: 'clamp(20px, 4vw, 28px)',
                                            fontWeight: 'bold'
                                        }}>
                                            {option.description}
                                        </Title>
                                        <Text style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: 'var(--color-text-secondary)' }}>
                                            {option.label}
                                        </Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    <Divider style={{ margin: 'clamp(16px, 3vh, 24px) 0' }} />

                    {/* 感谢文案 */}
                    <div style={{
                        textAlign: 'center',
                        padding: 'clamp(16px, 3vh, 24px) clamp(16px, 3vw, 20px)',
                        background: 'color-mix(in srgb, var(--color-bg-container) 90%, transparent)',
                        borderRadius: '10px',
                        marginTop: 'auto',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 0 0 1px rgba(0,0,0,0.05), 0 12px 30px -16px rgba(0,0,0,0.25)',
                        border: '0.5px solid rgba(255,255,255,0.24)',
                        backdropFilter: 'blur(12px) saturate(130%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(130%)'
                    }}>
                        <Title level={4} style={{ marginBottom: '12px', fontSize: 'clamp(16px, 3vw, 20px)' }}>
                            {displayConfig.thankYouTitle}
                        </Title>
                        <Paragraph style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            {displayConfig.thankYouDescription}
                        </Paragraph>
                        <div style={{ fontSize: 'clamp(18px, 3vw, 24px)' }}>
                            <StarOutlined style={{ color: '#faad14', margin: '0 4px' }} />
                            <StarOutlined style={{ color: '#faad14', margin: '0 4px' }} />
                            <StarOutlined style={{ color: '#faad14', margin: '0 4px' }} />
                            <StarOutlined style={{ color: '#faad14', margin: '0 4px' }} />
                            <StarOutlined style={{ color: '#faad14', margin: '0 4px' }} />
                        </div>
                    </div>
                </SectionBlock>
            </div>

            {/* 二维码弹窗 */}
            <Modal
                title={
                    <div style={{ textAlign: 'center' }}>
                        <Title level={3} style={{ marginBottom: '8px' }}>
                            {selectedOption?.description} {selectedOption?.label}
                        </Title>
                        <Text type="secondary">请使用微信扫码支付</Text>
                    </div>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={400}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Image
                        src={selectedOption?.image}
                        alt={`${selectedOption?.description}赞助码`}
                        style={{
                            maxWidth: '280px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-light)'
                        }}
                        preview={false}
                    />
                    <Paragraph style={{ marginTop: '20px', color: 'var(--color-text-secondary)' }}>
                        扫描二维码完成支付
                    </Paragraph>
                    <Paragraph style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                        支付后可添加微信/QQ联系我们获取权益
                    </Paragraph>
                </div>
            </Modal>
        </div>
    );
}
