import { Entity, ManyToOne, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { NotificationType, NotificationChannel } from '@/utils/shared/notification'

@Entity('notification_settings')
@Index(['userId', 'type', 'channel'], { unique: true })
export class NotificationSettings extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 36, nullable: false })
    userId: string

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User

    @CustomColumn({
        type: 'varchar',
        length: 32,
        default: NotificationType.SYSTEM,
    })
    type: NotificationType

    @CustomColumn({
        type: 'varchar',
        length: 32,
        default: NotificationChannel.EMAIL,
    })
    channel: NotificationChannel

    @CustomColumn({ type: 'boolean', default: true })
    isEnabled: boolean
}
