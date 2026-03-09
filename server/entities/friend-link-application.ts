import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'
import { FriendLinkApplicationStatus } from '@/types/friend-link'

@Entity('friend_link_applications')
export class FriendLinkApplication extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 120, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 500, nullable: false, index: true })
    url: string

    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    logo: string | null

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    categoryId: string | null

    @CustomColumn({ type: 'varchar', length: 100, nullable: true })
    categorySuggestion: string | null

    @CustomColumn({ type: 'varchar', length: 100, nullable: true })
    contactName: string | null

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    contactEmail: string

    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    rssUrl: string | null

    @CustomColumn({ type: 'varchar', length: 500, nullable: true })
    reciprocalUrl: string | null

    @CustomColumn({ type: 'text', nullable: true })
    message: string | null

    @CustomColumn({ type: 'varchar', length: 20, default: FriendLinkApplicationStatus.PENDING, index: true })
    status: FriendLinkApplicationStatus

    @CustomColumn({ type: 'text', nullable: true })
    reviewNote: string | null

    @CustomColumn({ type: 'varchar', length: 45, nullable: true })
    submittedIp: string | null

    @CustomColumn({ type: 'text', nullable: true })
    submittedUserAgent: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    reviewedById: string | null

    @CustomColumn({ type: getDateType(), nullable: true })
    reviewedAt: Date | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    friendLinkId: string | null
}
