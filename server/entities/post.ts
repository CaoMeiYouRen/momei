import { Entity, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { Category } from './category'
import { Tag } from './tag'

@Entity('post')
export class Post extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    title: string

    @CustomColumn({ type: 'varchar', length: 255, unique: true, nullable: false })
    slug: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'text', nullable: true })
    summary: string

    @CustomColumn({ type: 'text', nullable: true })
    coverImage: string

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh', nullable: false })
    language: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    translationId: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    authorId: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    categoryId: string

    @CustomColumn({ type: 'varchar', length: 20, default: 'pending', nullable: false })
    status: string // published, draft, pending

    @CustomColumn({ type: 'integer', default: 0 })
    views: number

    @CustomColumn({ type: 'datetime', nullable: true })
    publishedAt: Date

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
}
