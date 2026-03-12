import { Entity, ManyToOne, JoinColumn, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'
import { User } from './user'
import type { PostVersionDiffField, PostVersionSnapshot, PostVersionSource } from '@/types/post-version'

@Entity('post_version')
@Index(['postId', 'sequence'], { unique: true })
@Index(['postId', 'createdAt'])
export class PostVersion extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    postId: string

    @CustomColumn({ type: 'integer', nullable: true, index: true, comment: '文章内线性递增版本号' })
    sequence: number

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true, comment: '上一个版本 ID' })
    parentVersionId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true, comment: '恢复来源版本 ID' })
    restoredFromVersionId: string | null

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, default: 'edit', comment: '版本来源' })
    source: PostVersionSource

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '提交摘要' })
    commitSummary: string

    @CustomColumn({ type: 'json', nullable: true, comment: '本次变更涉及的字段' })
    changedFields: PostVersionDiffField[]

    @CustomColumn({ type: 'varchar', length: 64, nullable: true, index: true, comment: '快照哈希' })
    snapshotHash: string

    @CustomColumn({ type: 'json', nullable: true, comment: '结构化版本快照' })
    snapshot: PostVersionSnapshot

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    title: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'text', nullable: true })
    summary: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    authorId: string

    @CustomColumn({ type: 'varchar', length: 64, nullable: true, comment: '请求 IP' })
    ipAddress: string | null

    @CustomColumn({ type: 'varchar', length: 512, nullable: true, comment: '请求 User-Agent' })
    userAgent: string | null

    // ========== 关系定义 ==========

    @ManyToOne(() => Post, (post) => post.versions, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    post: Post

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn()
    author: User
}
