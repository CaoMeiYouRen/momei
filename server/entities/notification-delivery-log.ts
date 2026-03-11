import { Entity, Index } from 'typeorm'
import { getDateType } from '../database/type'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import type {
    NotificationType,
    NotificationDeliveryChannel,
    NotificationDeliveryStatus,
} from '@/utils/shared/notification'

@Entity('notification_delivery_logs')
@Index(['notificationType'])
@Index(['channel'])
@Index(['status'])
@Index(['sentAt'])
@Index(['recipient'])
export class NotificationDeliveryLog extends BaseEntity {
    @CustomColumn({ type: 'varchar', length: 36, nullable: true, comment: '关联的站内通知 ID' })
    notificationId: string | null

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, comment: '接收用户 ID' })
    userId: string | null

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, comment: '投递渠道' })
    channel: NotificationDeliveryChannel

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, comment: '投递状态' })
    status: NotificationDeliveryStatus

    @CustomColumn({ type: 'varchar', length: 32, nullable: false, comment: '通知类型' })
    notificationType: NotificationType

    @CustomColumn({ type: 'varchar', length: 255, nullable: false, comment: '通知标题' })
    title: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '接收对象展示值' })
    recipient: string | null

    @CustomColumn({ type: 'varchar', length: 255, nullable: true, comment: '跳转目标' })
    targetUrl: string | null

    @CustomColumn({ type: 'varchar', length: 512, nullable: true, comment: '失败或跳过原因' })
    errorMessage: string | null

    @CustomColumn({ type: getDateType(), nullable: false, comment: '投递时间' })
    sentAt: Date

    @CustomColumn({ type: 'simple-json', nullable: true, comment: '扩展投递元数据' })
    metadata: Record<string, unknown> | null
}
