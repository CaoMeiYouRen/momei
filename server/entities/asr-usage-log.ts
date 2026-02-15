import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * ASR 使用记录实体
 * 记录每次语音识别请求的详细信息
 */
@Entity('asr_usage_logs')
export class ASRUsageLog extends BaseEntity {
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
        comment: '模式 (batch, streaming)',
    })
    mode: string

    @CustomColumn({
        type: 'integer',
        comment: '音频时长（秒）',
    })
    audioDuration: number

    @CustomColumn({
        type: 'integer',
        comment: '音频大小（字节）',
    })
    audioSize: number

    @CustomColumn({
        type: 'integer',
        comment: '识别文本长度',
    })
    textLength: number

    @CustomColumn({
        type: 'varchar',
        length: 10,
        nullable: true,
        comment: '识别语言',
    })
    language: string | null

    @CustomColumn({
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
        comment: '估计成本',
    })
    cost: number
}
