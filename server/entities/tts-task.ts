import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * TTS 任务实体
 * 用于追踪耗时的 TTS 生成任务（标准 TTS 或 AI 播客）
 */
@Entity('tts_tasks')
export class TTSTask extends BaseEntity {
    @CustomColumn({
        type: 'varchar',
        length: 36,
        index: true,
        comment: '关联文章 ID',
    })
    postId: string

    @CustomColumn({
        type: 'varchar',
        length: 36,
        index: true,
        comment: '发起用户 ID',
    })
    userId: string

    @CustomColumn({
        type: 'varchar',
        length: 50,
        comment: 'TTS 提供者 (openai, azure, siliconflow, volcengine)',
    })
    provider: string

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '音频化模式 (speech, podcast)',
    })
    mode: string

    @CustomColumn({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '使用的模型',
    })
    model: string

    @CustomColumn({
        type: 'varchar',
        length: 150,
        nullable: true,
        comment: '选择的音色',
    })
    voice: string

    @CustomColumn({
        type: 'varchar',
        length: 20,
        default: 'pending',
        comment: '任务状态 (pending, processing, completed, failed)',
        index: true,
    })
    status: 'pending' | 'processing' | 'completed' | 'failed'

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '朗读稿内容 (若为空则读取文章原内容)',
    })
    script: string | null

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '进度百分比 (0-100)',
    })
    progress: number

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '任务结果 (JSON)',
    })
    result: string | null

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '失败错误信息',
    })
    errorMessage: string | null

    @CustomColumn({
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
        comment: '预估成本',
    })
    estimatedCost: number

    @CustomColumn({
        type: 'decimal',
        precision: 10,
        scale: 4,
        default: 0,
        comment: '实际成本',
    })
    actualCost: number

    @CustomColumn({
        type: 'datetime',
        nullable: true,
        comment: '开始时间',
    })
    startedAt: Date | null

    @CustomColumn({
        type: 'datetime',
        nullable: true,
        comment: '完成时间',
    })
    completedAt: Date | null
}
