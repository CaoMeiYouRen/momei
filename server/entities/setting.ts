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

    @UpdateDateColumn({ type: getDateType() })
    updatedAt: Date
}
