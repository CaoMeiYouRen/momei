import { Entity, Column, ManyToOne, Index } from 'typeorm'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { NotificationType } from '@/utils/shared/notification'

@Entity('in_app_notification')
@Index(['userId', 'isRead'])
@Index(['createdAt'])
export class InAppNotification extends BaseEntity {
    /**
     * 接收用户 ID，为 null 时表示全局通知/系统广播
     */
    @Column({ type: 'varchar', length: 36, nullable: true })
    userId: string | null

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    user: User | null

    /**
     * 通知类型
     */
    @Column({
        type: 'varchar',
        length: 32,
        default: NotificationType.SYSTEM,
    })
    type: NotificationType

    /**
     * 通知标题
     */
    @Column({ type: 'varchar', length: 255 })
    title: string

    /**
     * 通知内容
     */
    @Column({ type: 'text' })
    content: string

    /**
     * 关联链接
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    link: string | null

    /**
     * 是否已读
     */
    @Column({ type: 'boolean', default: false })
    isRead: boolean
}
