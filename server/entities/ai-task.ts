import { Entity, Column } from 'typeorm'
import { BaseEntity } from './base-entity'

/**
 * AI 任务实体
 * 用于追踪耗时的 AI 异步任务（如图像生成、TTS 等）
 */
@Entity('ai_tasks')
export class AITask extends BaseEntity {
    @Column({
        type: 'varchar',
        length: 50,
        comment: '任务类型',
    })
    type: string // 'image_generation' | 'tts' | 'podcast' | etc.

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
        default: 'pending',
        comment: '任务状态',
    })
    status: 'pending' | 'processing' | 'completed' | 'failed'

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

    // 以下为从 TTSTask 合并过来的字段，为了兼容性与统一查询
    @Column({
        type: 'varchar',
        length: 36,
        nullable: true,
        comment: '关联业务 ID (如文章 ID)',
    })
    postId: string

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
        comment: '业务模式 (对于 TTS 为 speech/podcast)',
    })
    mode: string

    @Column({
        type: 'varchar',
        length: 150,
        nullable: true,
        comment: '音色/风格 ID',
    })
    voice: string

    @Column({
        type: 'text',
        nullable: true,
        comment: '朗读稿内容 (若为空则读取文章原内容)',
    })
    script: string | null

    @Column({
        type: 'integer',
        default: 0,
        comment: '进度百分比 (0-100)',
    })
    progress: number

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
        comment: '预估成本',
    })
    estimatedCost: number

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
        comment: '实际成本',
    })
    actualCost: number

    @Column({
        type: 'datetime',
        nullable: true,
        comment: '开始时间',
    })
    startedAt: Date | null

    @Column({
        type: 'datetime',
        nullable: true,
        comment: '完成时间',
    })
    completedAt: Date | null
}
