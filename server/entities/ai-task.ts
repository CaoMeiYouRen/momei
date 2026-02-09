import { Entity, Column } from 'typeorm'
import { BaseEntity } from './base-entity'

/**
 * AI 任务实体
 * 用于追踪耗时的 AI 异步任务（如图像生成）
 */
@Entity('ai_tasks')
export class AITask extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 50,
        comment: '任务类型',
    })
    type: string // 'image_generation' | 'text_generation' | etc.

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: 'AI 服务商',
    })
    provider: string

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '使用的模型',
    })
    model: string

    @Column({
        type: 'varchar',
        length: 20,
        default: 'processing',
        comment: '任务状态',
    })
    status: 'processing' | 'completed' | 'failed'

    @Column({
        type: 'text',
        nullable: true,
        comment: '任务参数 (JSON)',
    })
    payload: string

    @Column({
        type: 'text',
        nullable: true,
        comment: '任务结果 (JSON)',
    })
    result: string

    @Column({
        type: 'text',
        nullable: true,
        comment: '失败原因',
    })
    error: string

    @Column({
        type: 'varchar',
        length: 36,
        comment: '发起用户 ID',
    })
    userId: string
}
