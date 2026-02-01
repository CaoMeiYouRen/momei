import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { Setting } from '@/server/entities/setting'
import { SettingKey } from '@/types/setting'
import { snowflake } from '@/server/utils/snowflake'
import { assignDefined } from '@/server/utils/object'
import logger from '@/server/utils/logger'

/**
 * 获取指定类型和语言的协议内容
 * @param type 协议类型
 * @param language 语言代码
 * @param preferMainVersion 是否优先返回主语言版本 (默认 true)
 */
export const getAgreementContent = async (
    type: 'user_agreement' | 'privacy_policy',
    language: string,
    preferMainVersion = true,
) => {
    const repo = dataSource.getRepository(AgreementContent)

    if (preferMainVersion) {
        // 优先查询主语言版本
        let agreement = await repo.findOne({
            where: { type, language, isMainVersion: true },
            order: { createdAt: 'DESC' },
        })

        // 如果主语言版本不存在，则查询该语言的最新版本
        if (!agreement) {
            agreement = await repo.findOne({
                where: { type, language },
                order: { createdAt: 'DESC' },
            })
        }

        return agreement || null
    }

    // 返回最新版本
    return await repo.findOne({
        where: { type, language },
        order: { createdAt: 'DESC' },
    })
}

/**
 * 获取当前生效的协议内容（根据配置中的主语言）
 * @param type 协议类型
 */
export const getActiveAgreementContent = async (
    type: 'user_agreement' | 'privacy_policy',
) => {
    const settingRepo = dataSource.getRepository(Setting)

    // 从配置中获取主语言
    const mainLanguageSetting = await settingRepo.findOne({
        where: { key: SettingKey.LEGAL_MAIN_LANGUAGE },
    })

    const mainLanguage = mainLanguageSetting?.value || 'zh-CN'

    // 获取该语言的主版本协议
    const agreement = await getAgreementContent(type, mainLanguage, true)

    if (!agreement) {
        logger.warn(`No active ${type} found for language ${mainLanguage}`)
        return null
    }

    return agreement
}

/**
 * 获取协议的所有版本
 * @param type 协议类型
 * @param language 语言代码 (可选，不指定则返回所有语言的版本)
 */
export const getAgreementVersions = async (
    type: 'user_agreement' | 'privacy_policy',
    language?: string,
) => {
    const repo = dataSource.getRepository(AgreementContent)

    const query = repo.createQueryBuilder('agreement')
        .where('agreement.type = :type', { type })

    if (language) {
        query.andWhere('agreement.language = :language', { language })
    }

    return await query
        .orderBy('agreement.createdAt', 'DESC')
        .getMany()
}

/**
 * 创建新版本的协议
 * @param data 协议数据 (包括 type, language, content, version, versionDescription, isMainVersion)
 */
export const createAgreementVersion = async (data: {
    type: 'user_agreement' | 'privacy_policy'
    language: string
    content: string
    version?: string | null
    versionDescription?: string | null
    isMainVersion?: boolean
}) => {
    const repo = dataSource.getRepository(AgreementContent)

    // 如果标记为主版本，则取消其他同类型同语言的主版本标记
    if (data.isMainVersion) {
        await repo.update(
            { type: data.type, language: data.language, isMainVersion: true },
            { isMainVersion: false },
        )
    }

    const agreement = repo.create({
        id: snowflake.generateId(),
        type: data.type,
        language: data.language,
        content: data.content,
        version: data.version || null,
        versionDescription: data.versionDescription || null,
        isMainVersion: data.isMainVersion || false,
        isFromEnv: false,
        hasUserConsent: false,
    })

    return await repo.save(agreement)
}

/**
 * 更新协议内容
 * @param id 协议 ID
 * @param updates 更新的字段
 */
export const updateAgreementContent = async (
    id: string,
    updates: Partial<Omit<AgreementContent, 'id' | 'createdAt'>>,
) => {
    const repo = dataSource.getRepository(AgreementContent)

    const agreement = await repo.findOne({ where: { id } })
    if (!agreement) {
        throw new Error(`Agreement with ID ${id} not found`)
    }

    // 禁止修改来自环境变量的内容
    if (agreement.isFromEnv) {
        throw new Error('Cannot modify agreement content from environment variables')
    }

    // 如果要标记为主版本，则取消其他同类型同语言的主版本标记
    if (updates.isMainVersion === true && !agreement.isMainVersion) {
        await repo.update(
            { type: agreement.type, language: agreement.language, isMainVersion: true },
            { isMainVersion: false },
        )
    }

    assignDefined(agreement, updates, [
        'content',
        'version',
        'versionDescription',
        'isMainVersion',
    ])
    return await repo.save(agreement)
}

/**
 * 删除协议版本
 * @param id 协议 ID
 */
export const deleteAgreementVersion = async (id: string) => {
    const repo = dataSource.getRepository(AgreementContent)

    const agreement = await repo.findOne({ where: { id } })
    if (!agreement) {
        throw new Error(`Agreement with ID ${id} not found`)
    }

    // 禁止删除来自环境变量的内容
    if (agreement.isFromEnv) {
        throw new Error('Cannot delete agreement content from environment variables')
    }

    // 禁止删除有用户已同意的版本
    if (agreement.hasUserConsent) {
        throw new Error('Cannot delete agreement version that users have consented to')
    }

    return await repo.remove(agreement)
}

/**
 * 设置当前生效的协议
 * @param type 协议类型
 * @param agreementId 协议版本 ID
 */
export const setActiveAgreement = async (
    type: 'user_agreement' | 'privacy_policy',
    agreementId: string,
) => {
    const repo = dataSource.getRepository(AgreementContent)
    const settingRepo = dataSource.getRepository(Setting)

    // 验证协议存在且是主版本
    const agreement = await repo.findOne({ where: { id: agreementId } })
    if (!agreement) {
        throw new Error(`Agreement with ID ${agreementId} not found`)
    }

    if (!agreement.isMainVersion) {
        throw new Error('Only main version agreements can be set as active')
    }

    // 更新配置
    const settingKey = type === 'user_agreement'
        ? SettingKey.LEGAL_USER_AGREEMENT_ID
        : SettingKey.LEGAL_PRIVACY_POLICY_ID

    let setting = await settingRepo.findOne({ where: { key: settingKey } })
    if (!setting) {
        setting = settingRepo.create({
            key: settingKey,
            value: agreementId,
            description: `Active ${type} ID`,
            level: 0, // 公开
            maskType: 'none',
        })
    } else {
        setting.value = agreementId
    }

    await settingRepo.save(setting)
    return agreement
}
