import { Entity, ManyToOne, ManyToMany, JoinTable, Unique, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { Category } from './category'
import { Tag } from './tag'
import { Comment } from './comment'
import { PostStatus, PostVisibility } from '@/types/post'

@Entity('post')
@Unique(['slug', 'language'])
export class Post extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false, index: true })
    title: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    slug: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'text', nullable: true })
    summary: string | null

    @CustomColumn({ type: 'text', nullable: true })
    coverImage: string | null

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh-CN', nullable: false, index: true })
    language: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, index: true })
    translationId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    authorId: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    categoryId: string | null

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '文章状态：draft, pending, published, rejected, hidden',
        default: PostStatus.DRAFT,
        index: true,
    })
    status: PostStatus

    @CustomColumn({
        type: 'varchar',
        length: 20,
        comment: '可见性：public, private, password, registered, subscriber',
        default: PostVisibility.PUBLIC,
        index: true,
    })
    visibility: PostVisibility

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '访问密码' })
    password: string | null

    @CustomColumn({ type: 'integer', default: 0, index: true })
    views: number

    @CustomColumn({ type: 'text', nullable: true })
    copyright: string | null

    @CustomColumn({ type: 'datetime', nullable: true, index: true })
    publishedAt: Date | null

    // ========== 关系定义 ==========

    @ManyToOne(() => User, (user) => user.posts, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    author: User

    @ManyToOne(() => Category, (category) => category.posts, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    category: Category

    @ManyToMany(() => Tag, (tag) => tag.posts)
    @JoinTable()
    tags: Tag[]

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]
}
