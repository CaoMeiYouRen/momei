import { Entity, PrimaryColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm'
import { CustomColumn } from '../decorators/custom-column'
import { getDateType } from '../database/type'
import { BaseEntity } from './base-entity'
/**
 * 协议内容版本表
 * 用于存储用户协议和隐私政策的版本历史
 *
 * @author CaoMeiYouRen
 * @date 2026-01-31
 * @export
 * @class AgreementContent
 */
@Entity('agreement_content')
export class AgreementContent extends BaseEntity {
    /**
     * 协议类型
     * user_agreement: 用户协议
     * privacy_policy: 隐私政策
     */
    @CustomColumn({ type: 'varchar', length: 32 })
    type: 'user_agreement' | 'privacy_policy'

    /**
     * 协议内容所属的语言
     * 如 zh-CN, en-US
     * 主语言版本具有法律效力
     */
    @CustomColumn({ type: 'varchar', length: 16 })
    language: string

    /**
     * 是否为主语言版本 (有法律效力)
     * 每个协议类型的每个语言只能有一个主版本
     */
    @CustomColumn({ type: 'boolean', default: false })
    isMainVersion: boolean

    /**
     * 协议内容 (HTML/Markdown)
     */
    @CustomColumn({ type: 'longtext' })
    content: string

    /**
     * 版本号 (从环境变量读取或手动指定)
     */
    @CustomColumn({ type: 'varchar', length: 32, nullable: true })
    version: string | null

    /**
     * 版本描述 (如 "添加了数据隐私条款")
     */
    @CustomColumn({ type: 'text', nullable: true })
    versionDescription: string | null

    /**
     * 是否来自环境变量 (如 USER_AGREEMENT_CONTENT 等)
     * 来自环境变量的内容禁止在后台修改
     */
    @CustomColumn({ type: 'boolean', default: false })
    isFromEnv: boolean

    /**
     * 该版本是否有用户已同意
     * 用于判断是否可以删除该版本
     */
    @CustomColumn({ type: 'boolean', default: false })
    hasUserConsent: boolean

}

