import { Entity, Index, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

export interface WebPushSubscriptionPayload {
    endpoint: string
    expirationTime?: number | null
    keys: {
        p256dh: string
        auth: string
    }
}

@Entity('web_push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
export class WebPushSubscription extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    userId: string

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User

    @CustomColumn({ type: 'varchar', length: 2048, nullable: false })
    endpoint: string

    @CustomColumn({ type: 'simple-json', nullable: false })
    subscription: WebPushSubscriptionPayload

    @CustomColumn({ type: 'varchar', length: 20, nullable: true })
    permission: string | null

    @CustomColumn({ type: 'varchar', length: 512, nullable: true })
    userAgent: string | null

    @CustomColumn({ type: 'varchar', length: 20, nullable: true })
    locale: string | null
}
