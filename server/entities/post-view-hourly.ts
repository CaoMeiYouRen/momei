import { Entity, Index, ManyToOne } from 'typeorm'
import { getDateType } from '../database/type'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { Post } from './post'

@Entity('post_view_hourly')
@Index(['postId', 'bucketHourUtc'], { unique: true })
@Index(['bucketHourUtc'])
export class PostViewHourly extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 36, nullable: false, index: true })
    postId: string

    @CustomColumn({ type: getDateType(), nullable: false })
    bucketHourUtc: Date

    @CustomColumn({ type: 'integer', nullable: false, default: 0 })
    views: number

    @ManyToOne(() => Post, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    post: Post
}
