import { Entity, OneToOne, JoinColumn, Index } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { BaseEntity } from './base-entity'
import { User } from './user'

/**
 * 联邦协议密钥实体
 * 存储用户的 RSA 密钥对，用于 ActivityPub HTTP 签名
 *
 * @author CaoMeiYouRen
 * @date 2025-03-04
 */
@Entity('fed_keys')
export class FedKey extends BaseEntity {
    /**
     * 关联的用户 ID
     */
    @Index()
    @CustomColumn({ type: 'varchar', length: 36 })
    userId: string

    /**
     * 关联的用户
     */
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    /**
     * RSA 公钥 (PEM 格式)
     */
    @CustomColumn({ type: 'text' })
    publicKey: string

    /**
     * RSA 私钥 (PEM 格式，加密存储)
     */
    @CustomColumn({ type: 'text' })
    privateKey: string

    /**
     * 密钥创建时间 (用于密钥轮换)
     */
    @CustomColumn({ type: 'datetime', nullable: true })
    expiresAt: Date | null
}
