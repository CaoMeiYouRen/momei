import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'

@Entity('marketing_campaign')
export class MarketingCampaign extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    title: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    /**
     * 推送类型
     */
    @CustomColumn({
        type: 'varchar',
        length: 32,
        default: MarketingCampaignType.FEATURE,
    })
    type: MarketingCampaignType

    /**
     * 推送目标条件 (如特定标签/分类订阅者)
     * 格式如: { categoryIds: [], tagIds: [] }
     */
    @CustomColumn({ type: 'simple-json', nullable: true })
    targetCriteria: any

    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    senderId: string

    @ManyToOne(() => User, { nullable: false })
    sender: User

    @CustomColumn({ type: 'datetime', nullable: true })
    sentAt: Date | null

    @CustomColumn({ type: 'datetime', nullable: true, index: true })
    scheduledAt: Date | null

    @CustomColumn({
        type: 'varchar',
        length: 32,
        default: MarketingCampaignStatus.DRAFT,
        index: true,
    })
    status: MarketingCampaignStatus
}
