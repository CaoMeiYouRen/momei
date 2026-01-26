import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { Post } from './post'
import { SnippetStatus } from '@/types/snippet'

@Entity('snippet')
export class Snippet extends BaseEntity {

    @CustomColumn({ type: 'text', nullable: false, comment: '灵感内容' })
    content: string

    @CustomColumn({ type: 'simple-json', nullable: true, comment: '媒体附件列表 (图片等)' })
    media: string[] | null

    @CustomColumn({ type: 'text', nullable: true, comment: '音频文件地址' })
    audioUrl: string | null

    @CustomColumn({ type: 'text', nullable: true, comment: '音频转写文本' })
    audioTranscription: string | null

    @CustomColumn({ type: 'varchar', length: 50, default: 'web', index: true, comment: '来源 (web, api, pwa...)' })
    source: string

    @CustomColumn({ type: 'simple-json', nullable: true, comment: '额外元数据 (sourceUrl, geo 等)' })
    metadata: Record<string, any> | null

    @CustomColumn({
        type: 'varchar',
        length: 20,
        default: SnippetStatus.INBOX,
        index: true,
        comment: '状态：inbox, converted, archived',
    })
    status: SnippetStatus

    // ========== 关系定义 ==========

    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    author: User

    @ManyToOne(() => Post, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    post: Post | null
}
