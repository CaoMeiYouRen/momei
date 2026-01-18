import { Entity, ManyToOne, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { Post } from './post'
import { CommentStatus } from '@/types/comment'

@Entity('comment')
export class Comment extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    postId: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    authorId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    parentId: string | null

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    authorName: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    authorEmail: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    authorUrl: string | null

    @CustomColumn({
        type: 'varchar',
        length: 20,
        default: CommentStatus.PUBLISHED,
        index: true,
    })
    status: CommentStatus

    @CustomColumn({ type: 'varchar', length: 45, nullable: true })
    ip: string | null

    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string | null

    @CustomColumn({ type: 'boolean', default: false })
    isSticked: boolean

    @CustomColumn({ type: 'integer', default: 0 })
    likes: number

    // ========== 关系定义 ==========

    @ManyToOne(() => Post, (post) => post.comments, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    post: Post

    @ManyToOne(() => User, (user) => user.comments, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    author: User | null

    @ManyToOne(() => Comment, (comment) => comment.replies, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    parent: Comment | null

    @OneToMany(() => Comment, (comment) => comment.parent)
    replies: Comment[]
}
