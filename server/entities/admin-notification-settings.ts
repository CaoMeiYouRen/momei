import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { AdminNotificationEvent } from '@/utils/shared/notification'

@Entity('admin_notification_settings')
export class AdminNotificationSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'varchar',
        length: 64,
        unique: true,
        nullable: false,
    })
    event: AdminNotificationEvent

    @Column({ type: 'boolean', default: true })
    isEmailEnabled: boolean

    @Column({ type: 'boolean', default: false })
    isBrowserEnabled: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
