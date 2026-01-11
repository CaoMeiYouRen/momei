import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('subscriber')
export class Subscriber extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string

    @CustomColumn({ type: 'boolean', default: true })
    isActive: boolean

    @CustomColumn({ type: 'varchar', length: 10, default: 'zh' })
    language: string
}
