import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'

/**
 * AI 任务实体
 * 用于追踪耗时的 AI 异步任务（如图像生成、TTS 等）
 */
@Entity('ai_tasks')
export class AITask extends BaseEntity {
    @CustomColumn({
        type: 'varchar',
        length: 50,
        comment: '任务类型',
    })
    type: string // 'image_generation' | 'tts' | 'podcast' | etc.

    @CustomColumn({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: 'AI 服务商',
    })
    provider: string

    @CustomColumn({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '使用的模型',
    })
    model: string

    @CustomColumn({
        type: 'varchar',
        length: 20,
        default: 'pending',
        comment: '任务状态',
    })
    status: 'pending' | 'processing' | 'completed' | 'failed'

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '任务参数 (JSON)',
    })
    payload: string

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '任务结果 (JSON)',
    })
    result: string

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '失败原因',
    })
    error: string | null

    @CustomColumn({
        type: 'varchar',
        length: 36,
        comment: '发起用户 ID',
    })
    userId: string

    // 以下为从 TTSTask 合并过来的字段，为了兼容性与统一查询
    @CustomColumn({
        type: 'varchar',
        length: 36,
        nullable: true,
        comment: '关联业务 ID (如文章 ID)',
    })
    postId: string

    @CustomColumn({
        type: 'varchar',
        length: 20,
        nullable: true,
        comment: '业务模式 (对于 TTS 为 speech/podcast)',
    })
    mode: string

    @CustomColumn({
        type: 'varchar',
        length: 150,
        nullable: true,
        comment: '音色/风格 ID',
    })
    voice: string

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

    // 以下为 ASR 相关字段
    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '音频时长（秒）',
    })
    audioDuration: number

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '音频大小（字节）',
    })
    audioSize: number

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '文本长度',
    })
    textLength: number

    @CustomColumn({
        type: 'varchar',
        length: 20,
        nullable: true,
        comment: '识别语言',
    })
    language: string | null

    @CustomColumn({
        type: getDateType(),
        nullable: true,
        comment: '开始时间',
    })
    startedAt: Date | null

    @CustomColumn({
        type: getDateType(),
        nullable: true,
        comment: '完成时间',
    })
    completedAt: Date | null
}
