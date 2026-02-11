import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'
import { User } from './user'

@Entity('post_version')
export class PostVersion extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    postId: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    title: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'text', nullable: true })
    summary: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    authorId: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '修改原因' })
    reason: string | null

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
    author: User
}
