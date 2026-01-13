import { Entity, ManyToMany, Unique } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'

@Entity('tag')
@Unique(['slug', 'language'])
export class Tag extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 100, unique: true, nullable: false, index: true })
    name: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    slug: string

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh-CN', nullable: false, index: true })
    language: string

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    translationId: string | null

    // ========== 关系定义 ==========

    @ManyToMany(() => Post, (post) => post.tags)
    posts: Post[]
}
