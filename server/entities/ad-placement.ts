import { Entity, ManyToOne, JoinColumn, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { AdCampaign } from './ad-campaign'
import { AdFormat, AdLocation, type AdPlacementMetadata, type AdTargeting } from '@/types/ad'

/**
 * 广告位实体
 * 用于定义单个广告位的配置，包括位置、格式、适配器和定向规则
 *
 * @author Claude Code
 * @date 2026-03-03
 */
@Entity('ad_placements')
@Index(['location', 'enabled'])
export class AdPlacement extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    name: string // 广告位名称

    @CustomColumn({
        type: 'varchar',
        length: 50,
        nullable: false,
        comment: '广告格式：display, native, video, responsive',
    })
    format: AdFormat

    @CustomColumn({
        type: 'varchar',
        length: 50,
        nullable: false,
        comment: '广告位置：header, sidebar, content_top, content_middle, content_bottom, footer',
        index: true,
    })
    location: AdLocation

    @CustomColumn({ type: 'varchar', length: 50, nullable: false, index: true })
    adapterId: string // 使用的适配器 ID (如 adsense, baidu, tencent)

    @CustomColumn({
        type: 'simple-json',
        nullable: true,
        comment: '广告位元数据（slot、尺寸等平台特定配置）',
    })
    metadata: AdPlacementMetadata | null

    @CustomColumn({
        type: 'boolean',
        default: true,
        index: true,
    })
    enabled: boolean // 是否启用

    @CustomColumn({
        type: 'simple-json',
        nullable: true,
        comment: '投放定向规则（分类、标签、语言等）',
    })
    targeting: AdTargeting | null

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '优先级，数字越大越优先',
    })
    priority: number

    @CustomColumn({
        type: 'text',
        nullable: true,
        comment: '自定义 CSS 样式',
    })
    customCss: string | null

    // ========== 关系定义 ==========

    @ManyToOne(() => AdCampaign, (campaign) => campaign.placements, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn()
    campaign: AdCampaign | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    campaignId: string | null
}
