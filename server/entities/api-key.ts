import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

@Entity('api_key')
export class ApiKey extends BaseEntity {
    @CustomColumn({ type: 'varchar', nullable: false })
    name: string

    @CustomColumn({ type: 'text', nullable: false, select: false }) // Don't select key hash by default
    key: string

    @CustomColumn({ type: 'varchar', length: 16, nullable: false })
    prefix: string

    @CustomColumn({ type: 'datetime', nullable: true })
    lastUsedAt: Date | null

    @CustomColumn({ type: 'datetime', nullable: true })
    expiresAt: Date | null

    @CustomColumn({ type: 'varchar', nullable: false })
    userId: string

    @ManyToOne(() => User, (user) => user.apiKeys, { onDelete: 'CASCADE' })
    user: User
}
