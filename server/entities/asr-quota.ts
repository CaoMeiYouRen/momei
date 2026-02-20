import { Entity, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * ASR 配额实体
 * 记录用户的语音识别使用额度
 */
@Entity('asr_quotas')
@Index(['userId', 'provider', 'periodType'], { unique: true })
export class ASRQuota extends BaseEntity {
    @CustomColumn({
        type: 'varchar',
        length: 36,
        index: true,
        comment: '用户 ID',
    })
    userId: string

    @CustomColumn({
        type: 'varchar',
        length: 50,
        comment: '提供者 (siliconflow, volcengine)',
    })
    provider: string

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '额度周期 (daily, monthly, total)',
    })
    periodType: string

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '已使用秒数',
    })
    usedSeconds: number

    @CustomColumn({
        type: 'integer',
        default: 3600, // 默认赠送 1 小时
        comment: '最大允许秒数',
    })
    maxSeconds: number

    @CustomColumn({
        type: 'datetime',
        nullable: true,
        comment: '重置时间',
    })
    resetAt: Date | null
}
