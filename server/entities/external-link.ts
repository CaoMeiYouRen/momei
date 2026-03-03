import { Entity, ManyToOne, JoinColumn, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { LinkStatus, type ExternalLinkMetadata } from '@/types/ad'

/**
 * 外链实体
 * 用于管理站外链接的短链生成、跳转追踪和安全过滤
 *
 * @author Claude Code
 * @date 2026-03-03
 */
@Entity('external_links')
@Index(['shortCode'], { unique: true })
@Index(['status'])
export class ExternalLink extends BaseEntity {

    @CustomColumn({ type: 'text', nullable: false })
    originalUrl: string // 原始 URL

    @CustomColumn({
        type: 'varchar',
        length: 50,
        nullable: false,
        unique: true,
        comment: '短码（用于跳转链接）',
    })
    shortCode: string // 短码 (用于跳转链接)

    @CustomColumn({
        type: 'varchar',
        length: 50,
        default: 'active',
        comment: '链接状态：active, blocked, expired',
        index: true,
    })
    status: LinkStatus

    @CustomColumn({
        type: 'boolean',
        default: false,
        comment: '是否添加 nofollow',
    })
    noFollow: boolean

    @CustomColumn({
        type: 'boolean',
        default: true,
        comment: '是否显示跳转页',
    })
    showRedirectPage: boolean

    @CustomColumn({
        type: 'integer',
        default: 0,
        comment: '点击次数统计',
    })
    clickCount: number

    @CustomColumn({
        type: 'simple-json',
        nullable: true,
        comment: '外链元数据（来源、标题、图标等）',
    })
    metadata: ExternalLinkMetadata | null

    // ========== 关系定义 ==========

    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn()
    createdBy: User

    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    createdById: string
}
