import { Entity } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'

@Entity('benefit_waitlist')
export class BenefitWaitlist extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 100, default: 'benefit' })
    purpose: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    name: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    email: string

    @CustomColumn({ type: 'varchar', length: 10, nullable: true })
    locale: string | null

    @CustomColumn({ type: 'varchar', length: 45, nullable: true })
    ip: string | null

    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string | null
}
