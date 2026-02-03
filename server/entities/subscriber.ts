import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

@Entity('subscriber')
export class Subscriber extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string

    @CustomColumn({ type: 'boolean', default: true })
    isActive: boolean

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh-CN' })
    language: string

    @CustomColumn({ type: 'simple-json', nullable: true })
    subscribedCategoryIds: string[] | null

    @CustomColumn({ type: 'simple-json', nullable: true })
    subscribedTagIds: string[] | null

    @CustomColumn({ type: 'boolean', default: true })
    isMarketingEnabled: boolean

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    userId: string | null

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    user: User | null
}
