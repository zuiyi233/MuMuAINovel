import { BankOutlined, DeleteOutlined, EditOutlined, ExportOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Popconfirm, Space, Tag, Typography } from 'antd';
import type { Character } from '../types';
import { cardStyles } from './CardStyles';

const { Text, Paragraph } = Typography;

interface CharacterCardProps {
  character: Character;
  onEdit?: (character: Character) => void;
  onDelete: (id: string) => void;
  onExport?: () => void;
}

const roleTypeColor: Record<string, string> = {
  protagonist: 'blue',
  supporting: 'green',
  antagonist: 'red',
};

const roleTypeLabel: Record<string, string> = {
  protagonist: '主角',
  supporting: '配角',
  antagonist: '反派',
};

const statusTagConfig: Record<string, { color: string; label: string }> = {
  deceased: { color: 'default', label: '已死亡' },
  missing: { color: 'warning', label: '已失踪' },
  retired: { color: 'default', label: '已退场' },
  destroyed: { color: 'default', label: '已覆灭' },
};

export function CharacterCard({ character, onEdit, onDelete, onExport }: CharacterCardProps) {
  const isOrganization = character.is_organization;
  const status = character.status || 'active';
  const isInactive = status !== 'active';
  const statusTag = statusTagConfig[status];

  return (
    <Card
      hoverable
      style={{
        ...(isOrganization ? cardStyles.organization : cardStyles.character),
        ...(isInactive ? { opacity: 0.65, filter: 'grayscale(35%)' } : {}),
      }}
      styles={{
        body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
        actions: { borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' },
      }}
      actions={[
        ...(onEdit ? [<EditOutlined key="edit" onClick={() => onEdit(character)} />] : []),
        ...(onExport ? [<ExportOutlined key="export" onClick={onExport} />] : []),
        <Popconfirm
          key="delete"
          title={`确定删除这个${isOrganization ? '组织' : '角色'}吗？`}
          onConfirm={() => onDelete(character.id)}
          okText="确定"
          cancelText="取消"
        >
          <DeleteOutlined />
        </Popconfirm>,
      ]}
    >
      <Card.Meta
        avatar={
          isOrganization ? (
            <BankOutlined style={{ fontSize: 32, color: 'var(--color-success)' }} />
          ) : (
            <UserOutlined style={{ fontSize: 32, color: 'var(--color-info)' }} />
          )
        }
        title={
          <Space wrap size={[6, 6]}>
            <span style={cardStyles.ellipsis}>{character.name}</span>
            {isOrganization ? (
              <Tag color="green">组织</Tag>
            ) : character.role_type ? (
              <Tag color={roleTypeColor[character.role_type] || 'default'}>
                {roleTypeLabel[character.role_type] || '其他'}
              </Tag>
            ) : null}
            {statusTag ? <Tag color={statusTag.color}>{statusTag.label}</Tag> : null}
          </Space>
        }
        description={
          <div style={cardStyles.description}>
            {!isOrganization ? (
              <>
                {character.age ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      年龄：
                    </Text>
                    <Text style={{ flex: 1 }}>{character.age}</Text>
                  </div>
                ) : null}
                {character.gender ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      性别：
                    </Text>
                    <Text style={{ flex: 1 }}>{character.gender}</Text>
                  </div>
                ) : null}
                {character.personality ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      性格：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }} ellipsis={{ tooltip: character.personality }}>
                      {character.personality}
                    </Text>
                  </div>
                ) : null}
                {character.relationships ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      关系：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }} ellipsis={{ tooltip: character.relationships }}>
                      {character.relationships}
                    </Text>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {character.organization_type ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      类型：
                    </Text>
                    <Tag color="cyan">{character.organization_type}</Tag>
                  </div>
                ) : null}
                {character.power_level !== undefined && character.power_level !== null ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      势力等级：
                    </Text>
                    <Tag color={character.power_level >= 70 ? 'red' : character.power_level >= 50 ? 'orange' : 'default'}>
                      {character.power_level}
                    </Tag>
                  </div>
                ) : null}
                {character.location ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      所在地：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }} ellipsis={{ tooltip: character.location }}>
                      {character.location}
                    </Text>
                  </div>
                ) : null}
                {character.color ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      代表色：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }}>{character.color}</Text>
                  </div>
                ) : null}
                {character.motto ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      格言：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }} ellipsis={{ tooltip: character.motto }}>
                      {character.motto}
                    </Text>
                  </div>
                ) : null}
                {character.organization_purpose ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      目的：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0 }} ellipsis={{ tooltip: character.organization_purpose }}>
                      {character.organization_purpose}
                    </Text>
                  </div>
                ) : null}
                {character.organization_members ? (
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start' }}>
                    <Text type="secondary" style={{ flexShrink: 0 }}>
                      成员：
                    </Text>
                    <Text style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.6, wordBreak: 'break-all' }}>
                      {typeof character.organization_members === 'string'
                        ? character.organization_members
                        : JSON.stringify(character.organization_members)}
                    </Text>
                  </div>
                ) : null}
              </>
            )}

            {character.background ? (
              <div style={{ marginTop: 12 }}>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }} ellipsis={{ tooltip: character.background, rows: 3 }}>
                  {character.background}
                </Paragraph>
              </div>
            ) : null}
          </div>
        }
      />
    </Card>
  );
}

export default CharacterCard;
