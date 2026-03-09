import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'
import { FriendLinkCategory } from './friend-link-category'
import { FriendLinkHealthStatus, FriendLinkStatus, type FriendLinkSource } from '@/types/friend-link'

@Entity('friend_links')
@Unique(['url'])
export class FriendLink extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 120, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 500, nullable: false, index: true })
    url: string

    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    logo: string | null

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    rssUrl: string | null

    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    contactEmail: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    categoryId: string | null

    @CustomColumn({ type: 'varchar', length: 20, default: FriendLinkStatus.DRAFT, index: true })
    status: FriendLinkStatus

    @CustomColumn({ type: 'varchar', length: 20, default: 'manual' })
    source: FriendLinkSource

    @CustomColumn({ type: 'boolean', default: false, index: true })
    isPinned: boolean

    @CustomColumn({ type: 'boolean', default: false, index: true })
    isFeatured: boolean

    @CustomColumn({ type: 'int', default: 0 })
    sortOrder: number

    @CustomColumn({ type: 'varchar', length: 20, default: FriendLinkHealthStatus.UNKNOWN, index: true })
    healthStatus: FriendLinkHealthStatus

    @CustomColumn({ type: 'int', default: 0 })
    consecutiveFailures: number

    @CustomColumn({ type: getDateType(), nullable: true })
    lastCheckedAt: Date | null

    @CustomColumn({ type: 'text', nullable: true })
    lastErrorMessage: string | null

    @CustomColumn({ type: 'int', nullable: true })
    lastHttpStatus: number | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    applicationId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    createdById: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    updatedById: string | null

    @ManyToOne(() => FriendLinkCategory, (category) => category.links, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn()
    category: FriendLinkCategory | null
}
