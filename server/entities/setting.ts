import { Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { getDateType } from '../database/type'

/**
 * 系统设置实体类
 * 采用键值对方式存储系统配置信息
 *
 * @author CaoMeiYouRen
 * @date 2026-01-18
 * @export
 * @class Setting
 */
@Entity('setting')
export class Setting {

    @PrimaryColumn('varchar', { length: 128 })
    key: string

    @CustomColumn({ type: 'text', nullable: true })
    value: string | null

    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    description: string | null

    /**
     * 脱敏类型
     * none: 不脱敏
     * password: 全部遮蔽 (********)
     * key: 保留前4位和后4位，中间遮蔽 (sk-a...bc12)
     */
    @CustomColumn({ type: 'varchar', length: 32, default: 'none' })
    maskType: string

    /**
     * 配置等级
     * 0: 公开 (任何用户可见)
     * 1: 受限 (仅登录用户可见)
     * 2: 后台可见 (仅管理员可见，可脱敏)
     * 3: 系统核心 (仅服务端可见，不返回前端)
     */
    @CustomColumn({ type: 'int', default: 2 })
    level: number

    @UpdateDateColumn({ type: getDateType() })
    updatedAt: Date
}
