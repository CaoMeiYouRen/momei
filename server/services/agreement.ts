import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { Setting } from '@/server/entities/setting'
import type {
    AgreementAdminItem,
    AgreementAdminListPayload,
    AgreementAdminOption,
    AgreementHistoryItem,
    AgreementPublicPayload,
    AgreementReviewStatus,
    AgreementRestrictionReason,
    AgreementType,
} from '@/types/agreement'
import { SettingKey } from '@/types/setting'
import { snowflake } from '@/server/utils/snowflake'
import { assignDefined } from '@/server/utils/object'
import logger from '@/server/utils/logger'
import { getDateTimestamp } from '@/utils/shared/date'

const DEFAULT_MAIN_LANGUAGE = 'zh-CN'
const PUBLIC_HISTORY_LIMIT = 5

type AgreementEntity = AgreementContent & {
    isAuthoritativeVersion?: boolean
    sourceAgreementId?: string | null
    effectiveAt?: Date | null
    reviewStatus?: AgreementReviewStatus | null
}

function getAgreementReviewStatus(agreement: AgreementEntity): AgreementReviewStatus {
    return agreement.reviewStatus || 'approved'
}

function isApprovedAgreement(agreement: AgreementEntity) {
    return getAgreementReviewStatus(agreement) === 'approved'
}

function getAgreementSettingKey(type: AgreementType) {
    return type === 'user_agreement'
        ? SettingKey.LEGAL_USER_AGREEMENT_ID
        : SettingKey.LEGAL_PRIVACY_POLICY_ID
}

function asIsoString(value?: Date | string | null) {
    if (!value) {
        return null
    }

    return new Date(value).toISOString()
}

function compareAgreementSort(a: AgreementEntity, b: AgreementEntity) {
    const getTime = (value?: Date | string | null) => getDateTimestamp(value)

    return getTime(b.effectiveAt)
        - getTime(a.effectiveAt)
        || getTime(b.updatedAt) - getTime(a.updatedAt)
        || getTime(b.createdAt) - getTime(a.createdAt)
}

function isAuthoritativeAgreement(agreement: AgreementEntity, mainLanguage: string) {
    if (agreement.language !== mainLanguage) {
        return false
    }

    return Boolean(agreement.isAuthoritativeVersion || agreement.isMainVersion)
}

function isReferenceTranslation(agreement: AgreementEntity, mainLanguage: string) {
    return agreement.language !== mainLanguage
}

async function getAgreementContext(type: AgreementType) {
    const settingRepo = dataSource.getRepository(Setting)
    const [mainLanguageSetting, activeSetting] = await Promise.all([
        settingRepo.findOne({ where: { key: SettingKey.LEGAL_MAIN_LANGUAGE } }),
        settingRepo.findOne({ where: { key: getAgreementSettingKey(type) } }),
    ])

    return {
        mainLanguage: mainLanguageSetting?.value || DEFAULT_MAIN_LANGUAGE,
        activeAgreementId: activeSetting?.value || null,
    }
}

async function getAgreementRecords(type: AgreementType) {
    const repo = dataSource.getRepository(AgreementContent)
    const records = await repo.find({ where: { type } })
    return records as AgreementEntity[]
}

function buildAuthorityLabel(agreement: AgreementEntity) {
    return [agreement.version || 'draft', agreement.language].join(' · ')
}

function buildHistoryItem(agreement: AgreementEntity, activeAgreementId: string | null): AgreementHistoryItem {
    return {
        id: agreement.id,
        version: agreement.version || null,
        versionDescription: agreement.versionDescription || null,
        language: agreement.language,
        effectiveAt: asIsoString(agreement.effectiveAt),
        updatedAt: asIsoString(agreement.updatedAt),
        isCurrentActive: agreement.id === activeAgreementId,
    }
}

async function resolveAgreementPair(type: AgreementType, preferredLanguage?: string) {
    const { mainLanguage, activeAgreementId } = await getAgreementContext(type)
    const records = await getAgreementRecords(type)
    const byId = new Map(records.map((record) => [record.id, record]))

    const authoritativeVersions = records
        .filter((record) => isAuthoritativeAgreement(record, mainLanguage))
        .sort(compareAgreementSort)
    const approvedAuthoritativeVersions = authoritativeVersions.filter((record) => isApprovedAgreement(record))

    let activeAuthoritative = activeAgreementId
        ? byId.get(activeAgreementId) || null
        : null

    if (!activeAuthoritative || !isAuthoritativeAgreement(activeAuthoritative, mainLanguage) || !isApprovedAgreement(activeAuthoritative)) {
        activeAuthoritative = approvedAuthoritativeVersions[0] || null
    }

    if (!activeAuthoritative) {
        return {
            mainLanguage,
            activeAgreementId,
            authoritativeAgreement: null,
            displayAgreement: null,
            isReferenceTranslation: false,
            fallbackToAuthoritative: false,
            history: [] as AgreementHistoryItem[],
            sourceAgreement: null,
            records,
        }
    }

    const normalizedLanguage = preferredLanguage || mainLanguage
    const translation = normalizedLanguage === mainLanguage
        ? null
        : records
            .filter((record) => record.language === normalizedLanguage
                && record.sourceAgreementId === activeAuthoritative.id
                && isApprovedAgreement(record))
            .sort(compareAgreementSort)[0] || null

    const displayAgreement = translation || activeAuthoritative

    return {
        mainLanguage,
        activeAgreementId: activeAuthoritative.id,
        authoritativeAgreement: activeAuthoritative,
        displayAgreement,
        isReferenceTranslation: Boolean(translation),
        fallbackToAuthoritative: normalizedLanguage !== mainLanguage && !translation,
        history: approvedAuthoritativeVersions.slice(0, PUBLIC_HISTORY_LIMIT).map((record) => buildHistoryItem(record, activeAuthoritative.id)),
        sourceAgreement: translation ? activeAuthoritative : null,
        records,
    }
}

function resolveSourceAgreement(
    type: AgreementType,
    mainLanguage: string,
    records: AgreementEntity[],
    activeAgreementId: string | null,
    sourceAgreementId?: string | null,
) {
    const authoritativeVersions = records.filter((record) => isAuthoritativeAgreement(record, mainLanguage))

    const sourceAgreement = sourceAgreementId
        ? authoritativeVersions.find((record) => record.id === sourceAgreementId) || null
        : authoritativeVersions.find((record) => record.id === activeAgreementId)
            || authoritativeVersions.sort(compareAgreementSort)[0]
            || null

    if (!sourceAgreement) {
        throw new Error('Reference translations must link to an authoritative agreement version')
    }

    if (!isAuthoritativeAgreement(sourceAgreement, mainLanguage)) {
        throw new Error('Reference translations can only link to authoritative agreement versions')
    }

    if (sourceAgreement.type !== type) {
        throw new Error('Reference translation source type mismatch')
    }

    return sourceAgreement
}

function buildRestrictionReasons(
    agreement: AgreementEntity,
    activeAgreementId: string | null,
    mainLanguage: string,
): AgreementRestrictionReason[] {
    const reasons: AgreementRestrictionReason[] = []

    if (agreement.isFromEnv) {
        reasons.push('env_locked')
    }
    if (agreement.hasUserConsent) {
        reasons.push('consented')
    }
    if (agreement.id === activeAgreementId && isAuthoritativeAgreement(agreement, mainLanguage)) {
        reasons.push('active_authoritative')
    }

    return reasons
}

/**
 * 获取指定类型和语言的协议内容
 * @param type 协议类型
 * @param language 语言代码
 * @param preferMainVersion 是否优先返回主语言版本 (默认 true)
 */
export const getAgreementContent = async (
    type: AgreementType,
    language: string,
    preferMainVersion = true,
) => {
    const { mainLanguage } = await getAgreementContext(type)
    const records = await getAgreementRecords(type)
    const localizedRecords = records.filter((record) => record.language === language).sort(compareAgreementSort)

    if (preferMainVersion && language === mainLanguage) {
        return localizedRecords.find((record) => isAuthoritativeAgreement(record, mainLanguage)) || localizedRecords[0] || null
    }

    return localizedRecords[0] || null
}

/**
 * 获取当前生效的协议内容（根据配置中的主语言）
 * @param type 协议类型
 */
export const getActiveAgreementContent = async (
    type: AgreementType,
    preferredLanguage?: string,
): Promise<AgreementPublicPayload | null> => {
    const resolved = await resolveAgreementPair(type, preferredLanguage)

    if (!resolved.displayAgreement || !resolved.authoritativeAgreement) {
        logger.warn(`No active ${type} found for language ${resolved.mainLanguage}`)
        return null
    }

    return {
        id: resolved.displayAgreement.id,
        type: resolved.displayAgreement.type,
        language: resolved.displayAgreement.language,
        content: resolved.displayAgreement.content,
        version: resolved.displayAgreement.version || null,
        versionDescription: resolved.displayAgreement.versionDescription || null,
        effectiveAt: asIsoString(resolved.sourceAgreement?.effectiveAt || resolved.displayAgreement.effectiveAt),
        updatedAt: asIsoString(resolved.displayAgreement.updatedAt),
        authoritativeLanguage: resolved.mainLanguage,
        authoritativeVersion: resolved.authoritativeAgreement.version || null,
        isDefault: false,
        isReferenceTranslation: resolved.isReferenceTranslation,
        fallbackToAuthoritative: resolved.fallbackToAuthoritative,
        sourceAgreementId: resolved.sourceAgreement?.id || null,
        sourceAgreementVersion: resolved.sourceAgreement?.version || null,
        history: resolved.history,
    }
}

/**
 * 获取协议的所有版本
 * @param type 协议类型
 * @param language 语言代码 (可选，不指定则返回所有语言的版本)
 */
export const getAgreementVersions = async (
    type: AgreementType,
    language?: string,
): Promise<AgreementAdminListPayload> => {
    const { mainLanguage, activeAgreementId } = await getAgreementContext(type)
    const records = await getAgreementRecords(type)
    const byId = new Map(records.map((record) => [record.id, record]))
    const filteredRecords = (language
        ? records.filter((record) => record.language === language)
        : records
    ).sort(compareAgreementSort)

    const authoritativeOptions: AgreementAdminOption[] = records
        .filter((record) => isAuthoritativeAgreement(record, mainLanguage))
        .sort(compareAgreementSort)
        .map((record) => ({
            id: record.id,
            version: record.version || null,
            language: record.language,
            label: buildAuthorityLabel(record),
        }))

    const items: AgreementAdminItem[] = filteredRecords.map((record) => {
        const sourceAgreement = record.sourceAgreementId ? byId.get(record.sourceAgreementId) || null : null
        const restrictionReasons = buildRestrictionReasons(record, activeAgreementId, mainLanguage)
        const isReference = isReferenceTranslation(record, mainLanguage)

        return {
            id: record.id,
            type: record.type,
            language: record.language,
            version: record.version || null,
            versionDescription: record.versionDescription || null,
            content: record.content,
            reviewStatus: getAgreementReviewStatus(record),
            isFromEnv: record.isFromEnv,
            hasUserConsent: record.hasUserConsent,
            isAuthoritativeVersion: isAuthoritativeAgreement(record, mainLanguage),
            isReferenceTranslation: isReference,
            isCurrentActive: record.id === activeAgreementId,
            isCurrentReference: Boolean(isReference && record.sourceAgreementId && record.sourceAgreementId === activeAgreementId),
            sourceAgreementId: record.sourceAgreementId || null,
            sourceAgreementVersion: sourceAgreement?.version || null,
            sourceAgreementLanguage: sourceAgreement?.language || null,
            effectiveAt: asIsoString(record.effectiveAt || sourceAgreement?.effectiveAt),
            updatedAt: asIsoString(record.updatedAt),
            createdAt: asIsoString(record.createdAt),
            canEdit: restrictionReasons.length === 0,
            canDelete: restrictionReasons.length === 0,
            canActivate: restrictionReasons.length === 0 && isAuthoritativeAgreement(record, mainLanguage) && isApprovedAgreement(record),
            restrictionReasons,
        }
    })

    return {
        mainLanguage,
        activeAgreementId,
        items,
        authoritativeOptions,
    }
}

/**
 * 创建新版本的协议
 * @param data 协议数据 (包括 type, language, content, version, versionDescription, isMainVersion)
 */
export const createAgreementVersion = async (data: {
    type: AgreementType
    language: string
    content: string
    version?: string | null
    versionDescription?: string | null
    sourceAgreementId?: string | null
    reviewStatus?: AgreementReviewStatus
}) => {
    const repo = dataSource.getRepository(AgreementContent)
    const { mainLanguage, activeAgreementId } = await getAgreementContext(data.type)
    const records = await getAgreementRecords(data.type)
    const isAuthoritativeVersion = data.language === mainLanguage
    const sourceAgreement = isAuthoritativeVersion
        ? null
        : resolveSourceAgreement(data.type, mainLanguage, records, activeAgreementId, data.sourceAgreementId)

    const agreement = repo.create({
        id: snowflake.generateId(),
        type: data.type,
        language: data.language,
        content: data.content,
        version: data.version || null,
        versionDescription: data.versionDescription || null,
        reviewStatus: data.reviewStatus || 'draft',
        isMainVersion: isAuthoritativeVersion,
        isAuthoritativeVersion,
        sourceAgreementId: sourceAgreement?.id || null,
        effectiveAt: null,
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

    const { mainLanguage, activeAgreementId } = await getAgreementContext(agreement.type)
    if (agreement.hasUserConsent) {
        throw new Error('Cannot modify agreement version that users have already consented to')
    }
    if (agreement.id === activeAgreementId && isAuthoritativeAgreement(agreement, mainLanguage)) {
        throw new Error('Cannot modify the currently active authoritative agreement; create a new version instead')
    }

    const records = await getAgreementRecords(agreement.type)
    const sourceAgreement = agreement.language === mainLanguage
        ? null
        : resolveSourceAgreement(
            agreement.type,
            mainLanguage,
            records,
            activeAgreementId,
            updates.sourceAgreementId ?? agreement.sourceAgreementId,
        )

    assignDefined(agreement, updates, [
        'content',
        'version',
        'versionDescription',
        'sourceAgreementId',
    ])

    if (
        Object.hasOwn(updates, 'content')
        || Object.hasOwn(updates, 'version')
        || Object.hasOwn(updates, 'versionDescription')
        || Object.hasOwn(updates, 'sourceAgreementId')
    ) {
        agreement.reviewStatus = 'draft'
    }

    agreement.isAuthoritativeVersion = agreement.language === mainLanguage
    agreement.isMainVersion = agreement.isAuthoritativeVersion
    agreement.sourceAgreementId = sourceAgreement?.id || null

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

    const { mainLanguage, activeAgreementId } = await getAgreementContext(agreement.type)
    if (agreement.id === activeAgreementId && isAuthoritativeAgreement(agreement, mainLanguage)) {
        throw new Error('Cannot delete the currently active authoritative agreement')
    }

    return await repo.remove(agreement)
}

/**
 * 设置当前生效的协议
 * @param type 协议类型
 * @param agreementId 协议版本 ID
 */
export const setActiveAgreement = async (
    type: AgreementType,
    agreementId: string,
) => {
    const repo = dataSource.getRepository(AgreementContent)
    const settingRepo = dataSource.getRepository(Setting)
    const { mainLanguage } = await getAgreementContext(type)

    const agreement = await repo.findOne({ where: { id: agreementId } })
    if (!agreement) {
        throw new Error(`Agreement with ID ${agreementId} not found`)
    }

    if (!isAuthoritativeAgreement(agreement, mainLanguage)) {
        throw new Error('Only authoritative-language versions can be set as active')
    }

    if (!isApprovedAgreement(agreement)) {
        throw new Error('Only approved agreements can be activated')
    }

    agreement.effectiveAt = new Date()
    await repo.save(agreement)

    const settingKey = getAgreementSettingKey(type)

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

export const setAgreementReviewStatus = async (
    id: string,
    nextStatus: AgreementReviewStatus,
) => {
    const repo = dataSource.getRepository(AgreementContent)
    const agreement = await repo.findOne({ where: { id } })

    if (!agreement) {
        throw new Error(`Agreement with ID ${id} not found`)
    }

    if (agreement.isFromEnv) {
        throw new Error('Cannot modify agreement content from environment variables')
    }

    if (agreement.hasUserConsent) {
        throw new Error('Cannot modify agreement version that users have already consented to')
    }

    const { mainLanguage, activeAgreementId } = await getAgreementContext(agreement.type)
    if (agreement.id === activeAgreementId && isAuthoritativeAgreement(agreement, mainLanguage)) {
        throw new Error('Cannot change the review status of the currently active authoritative agreement')
    }

    const currentStatus = getAgreementReviewStatus(agreement)
    if (currentStatus === nextStatus) {
        return agreement
    }

    if (nextStatus === 'pending_review' && currentStatus !== 'draft') {
        throw new Error('Only draft agreements can be submitted for review')
    }

    if (nextStatus === 'approved' && !['draft', 'pending_review'].includes(currentStatus)) {
        throw new Error('Only draft or pending-review agreements can be approved')
    }

    agreement.reviewStatus = nextStatus
    return await repo.save(agreement)
}

export const markAgreementConsentForLocale = async (preferredLanguage?: string) => {
    const repo = dataSource.getRepository(AgreementContent)
    const ids = new Set<string>()

    for (const type of ['user_agreement', 'privacy_policy'] as AgreementType[]) {
        const resolved = await resolveAgreementPair(type, preferredLanguage)
        if (resolved.displayAgreement?.id) {
            ids.add(resolved.displayAgreement.id)
        }
        if (resolved.authoritativeAgreement?.id) {
            ids.add(resolved.authoritativeAgreement.id)
        }
    }

    await Promise.all(Array.from(ids).map(async (id) => {
        await repo.update({ id }, { hasUserConsent: true })
    }))
}
