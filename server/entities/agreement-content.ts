import { Entity } from 'typeorm'
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
     * 兼容旧数据的遗留字段。
     * 新逻辑不再依赖该字段判断“当前生效版本”，仅保留为主语言权威版本的兼容标识。
     */
    @CustomColumn({ type: 'boolean', default: false })
    isMainVersion: boolean

    /**
     * 是否为具有法律效力的权威版本。
     * 仅主语言协议会被标记为 true；参考译本始终为 false。
     */
    @CustomColumn({ type: 'boolean', default: false })
    isAuthoritativeVersion: boolean

    /**
     * 若当前记录是参考译本，则指向对应的权威版本 ID。
     */
    @CustomColumn({ type: 'varchar', length: 36, nullable: true })
    sourceAgreementId: string | null

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
     * 当前版本生效日期。
     * 只有被后台显式激活的权威版本会写入该字段。
     */
    @CustomColumn({ type: getDateType(), nullable: true })
    effectiveAt: Date | null

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

