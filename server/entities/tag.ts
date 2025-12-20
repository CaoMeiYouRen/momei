import { Entity, ManyToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'

@Entity('tag')
export class Tag extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 100, unique: true, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 100, unique: true, nullable: false })
    slug: string

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh', nullable: false })
    language: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    translationId: string

    // ========== 关系定义 ==========

    @ManyToMany(() => Post, (post) => post.tags)
    posts: Post[]
}
