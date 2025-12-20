import { Entity, ManyToOne, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'

@Entity('category')
export class Category extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 100, unique: true, nullable: false })
    slug: string

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    parentId: string | null

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh', nullable: false })
    language: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
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
