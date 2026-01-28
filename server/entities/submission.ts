import { Entity, ManyToOne } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'
import { SubmissionStatus } from '@/types/submission'

@Entity('submission')
export class Submission extends BaseEntity {

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    title: string

    @CustomColumn({ type: 'text', nullable: false })
    content: string

    @CustomColumn({ type: 'varchar', length: 100, nullable: false })
    contributorName: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: false })
    contributorEmail: string

    @CustomColumn({ type: 'varchar', length: 255, nullable: true })
    contributorUrl: string | null

    @CustomColumn({
        type: 'varchar',
        length: 20,
        default: SubmissionStatus.PENDING,
        index: true,
    })
    status: SubmissionStatus

    @CustomColumn({ type: 'varchar', length: 36, nullable: true, index: true })
    authorId: string | null

    @CustomColumn({ type: 'text', nullable: true, comment: '管理员审核备注 (内部可见)' })
    adminNote: string | null

    @CustomColumn({ type: 'varchar', length: 45, nullable: true })
    ip: string | null

    @CustomColumn({ type: 'text', nullable: true })
    userAgent: string | null

    // ========== 关系定义 ==========

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    author: User | null
}
