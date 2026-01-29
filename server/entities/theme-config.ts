import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

/**
 * 主题配置方案实体类
 * 用于保存多套自定义主题方案
 *
 * @author GitHub Copilot
 * @date 2026-01-29
 * @export
 * @class ThemeConfig
 * @extends {BaseEntity}
 */
@Entity('theme_config')
export class ThemeConfig extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 128 })
    name: string

    @CustomColumn({ type: 'text', nullable: true })
    description: string | null

    /**
     * 配置数据，存储为 JSON 字符串
     * 包含 primaryColor, borderRadius, customCss 等
     */
    @CustomColumn({ type: 'text' })
    configData: string

    /**
     * 前端截取的预览图 (Base64)
     */
    @CustomColumn({ type: 'mediumtext', nullable: true })
    previewImage: string | null

    /**
     * 是否为系统预设 (不可删除)
     */
    @CustomColumn({ type: 'boolean', default: false })
    isSystem: boolean
}
