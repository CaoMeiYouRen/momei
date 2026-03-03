import { Entity, OneToMany } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { AdPlacement } from './ad-placement'
import { CampaignStatus, type CampaignTargeting } from '@/types/ad'

/**
 * 广告活动实体
 * 用于管理一组相关的广告位，支持活动级别的统计和控制
 *
 * @author Claude Code
 * @date 2026-03-03
 */
@Entity('ad_campaigns')
export class AdCampaign extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    name: string // 活动名称

    @CustomColumn({
        type: 'varchar',
        length: 50,
        default: 'draft',
        comment: '活动状态：draft, active, paused, ended',
        index: true,
    })
    status: CampaignStatus

    @CustomColumn({
        type: 'datetime',
        nullable: true,
        comment: '活动开始时间',
    })
    startDate: Date | null

    @CustomColumn({
        type: 'datetime',
        nullable: true,
        comment: '活动结束时间',
    })
    endDate: Date | null

    @CustomColumn({
        type: 'simple-json',
        nullable: true,
        comment: '活动级投放定向规则',
    })
    targeting: CampaignTargeting | null

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '展示次数统计',
    })
    impressions: number

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '点击次数统计',
    })
    clicks: number

    @CustomColumn({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: '收益统计',
    })
    revenue: number

    // ========== 关系定义 ==========

    @OneToMany(() => AdPlacement, (placement) => placement.campaign)
    placements: AdPlacement[]
}
