import { Entity, ManyToOne, OneToMany, Unique } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'

@Entity('category')
@Unique(['slug', 'language'])
@Unique(['name', 'language'])
@Unique(['translationId', 'language'])
export class Category extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 100, nullable: false, index: true })
    name: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    slug: string

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    parentId: string | null

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh-CN', nullable: false, index: true })
    language: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, index: true })
    translationId: string | null

    // ========== 关系定义 ==========

    @ManyToOne(() => Category, (category) => category.children, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    parent: Category

    @OneToMany(() => Category, (category) => category.parent)
    children: Category[]

    @OneToMany(() => Post, (post) => post.category)
    posts: Post[]
}
