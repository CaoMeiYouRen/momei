import { Entity, ManyToOne, JoinColumn, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import type {
    SettingAuditAction,
    SettingAuditSourceType,
    SettingEffectiveSource,
    SettingMaskType,
} from '@/types/setting'

@Entity('setting_audit_logs')
@Index(['settingKey'])
@Index(['operatorId'])
export class SettingAuditLog extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 128, nullable: false, comment: '设置键名' })
    settingKey: string

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, comment: '变更动作' })
    action: SettingAuditAction

    @CustomColumn({ type: 'text', nullable: true, comment: '变更前值（已按脱敏策略存储）' })
    oldValue: string | null

    @CustomColumn({ type: 'text', nullable: true, comment: '变更后值（已按脱敏策略存储）' })
    newValue: string | null

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, default: 'none', comment: '值脱敏策略' })
    maskType: SettingMaskType

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, default: 'db', comment: '当前生效来源' })
    effectiveSource: SettingEffectiveSource

    @CustomColumn({ type: 'boolean', default: false, comment: '当前是否被 ENV 覆盖' })
    isOverriddenByEnv: boolean

    @CustomColumn({ type: 'varchar', length: 64, nullable: false, default: 'admin_ui', comment: '变更触发来源' })
    source: SettingAuditSourceType

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '变更原因' })
    reason: string | null

    @CustomColumn({ type: 'varchar', length: 64, nullable: true, comment: '请求 IP' })
    ipAddress: string | null

    @CustomColumn({ type: 'varchar', length: 512, nullable: true, comment: '请求 User-Agent' })
    userAgent: string | null

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn()
    operator: User | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, comment: '操作者 ID' })
    operatorId: string | null
}
