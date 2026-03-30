import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Setting } from '@/server/entities/setting'
import { recordSettingAuditLogs, type SettingAuditChange, type SettingAuditContext } from '@/server/services/setting-audit'
import {
    SETTING_ENV_MAP,
    doesSettingRequireRestart,
    getLocalizedSettingDefinition,
    getSettingDefaultValue,
    getSettingEffectiveSource,
    getSettingLockReason,
    getSettingLookupKeys,
    isInternalOnlySettingKey,
    isLegacyOnlySettingKey,
    isSettingEnvLocked,
    resolveSettingEnvEntry,
} from '@/server/services/setting.constants'
import logger from '@/server/utils/logger'
import { isMaskedSettingPlaceholder, maskSettingValue, resolveSettingLevel, resolveSettingMaskType } from '@/server/utils/settings'
import {
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
} from '@/utils/shared/localized-settings'
import {
    SettingKey,
    type LocalizedSettingMetadata,
    type LocalizedSettingScalar,
    type LocalizedSettingValueV1,
    type ResolvedLocalizedSetting,
    type SettingResolvedItem,
    type SettingValue,
} from '@/types/setting'

export {
    FORCED_ENV_LOCKED_KEYS,
    INTERNAL_ONLY_ENV_KEYS,
    INTERNAL_ONLY_KEYS,
    INTERNAL_ONLY_SETTING_KEYS,
    LOCALIZED_SETTING_DEFINITIONS,
    SETTING_ENV_MAP,
    doesSettingRequireRestart,
    getLocalizedSettingDefinition,
    getSettingDefaultValue,
    getSettingEffectiveSource,
    getSettingLockReason,
    getSettingLookupKeys,
    isInternalOnlySettingKey,
    isLegacyOnlySettingKey,
    isLocalizedSettingKey,
    isSettingEnvLocked,
    resolveSettingEnvEntry,
} from '@/server/services/setting.constants'

interface ParsedLocalizedSettingState {
    payload: LocalizedSettingValueV1 | null
    legacyValue: LocalizedSettingScalar | null
    structured: boolean
    legacyFormat: boolean
    availableLocales: string[]
}

function isSettingWriteEnvelope(value: unknown): value is {
    value?: unknown
    description?: string | null
    level?: number | null
    maskType?: string | null
} {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false
    }

    return 'value' in value
        || 'description' in value
        || 'level' in value
        || 'maskType' in value
}

function parseStoredLocalizedSettingValue(key: string, rawValue: string | null | undefined): ParsedLocalizedSettingState | null {
    const definition = getLocalizedSettingDefinition(key)

    if (!definition) {
        return null
    }

    if (!rawValue || rawValue.trim().length === 0) {
        return {
            payload: null,
            legacyValue: null,
            structured: false,
            legacyFormat: false,
            availableLocales: [],
        }
    }

    try {
        const parsedValue = JSON.parse(rawValue) as unknown
        if (isLocalizedSettingValue(parsedValue, definition.valueType)) {
            return {
                payload: parsedValue,
                legacyValue: parsedValue.legacyValue ?? null,
                structured: true,
                legacyFormat: false,
                availableLocales: Object.keys(parsedValue.locales),
            }
        }
    } catch {
        // Fall through to legacy single-value compatibility.
    }

    return {
        payload: null,
        legacyValue: normalizeLocalizedLegacyValue(rawValue, definition.valueType),
        structured: false,
        legacyFormat: true,
        availableLocales: [],
    }
}

function getLocalizedSettingMetadata(key: string, rawValue: string | null | undefined): LocalizedSettingMetadata | null {
    const definition = getLocalizedSettingDefinition(key)
    const parsedState = parseStoredLocalizedSettingValue(key, rawValue)

    if (!definition || !parsedState) {
        return null
    }

    return {
        valueType: definition.valueType,
        structured: parsedState.structured,
        legacyFormat: parsedState.legacyFormat,
        legacyValuePresent: hasMeaningfulLocalizedValue(parsedState.legacyValue),
        availableLocales: parsedState.availableLocales.map((locale) => resolveRequestedAppLocale(locale)),
    }
}

function normalizeResolvedSettingValue(key: string, rawValue: unknown): SettingValue {
    const definition = getLocalizedSettingDefinition(key)

    if (definition && typeof rawValue === 'string') {
        const parsedState = parseStoredLocalizedSettingValue(key, rawValue)
        if (parsedState?.structured && parsedState.payload) {
            return parsedState.payload
        }
    }

    if (isLocalizedSettingValue(rawValue, definition?.valueType)) {
        return rawValue
    }

    return normalizeSettingValue(rawValue)
}

function resolveSettingRecordFromMap(settingsMap: Map<string, Setting>, key: string) {
    for (const lookupKey of getSettingLookupKeys(key)) {
        const setting = settingsMap.get(lookupKey)
        if (setting) {
            return setting
        }
    }

    return null
}

function collectSettingLookupKeys(keys: (SettingKey | string)[]) {
    return [...new Set(keys.flatMap((key) => getSettingLookupKeys(key)))]
}

async function fetchSettingsMap(keys: (SettingKey | string)[]) {
    if (!dataSource.isInitialized || keys.length === 0) {
        return new Map<string, Setting>()
    }

    const lookupKeys = collectSettingLookupKeys(keys)
    if (lookupKeys.length === 0) {
        return new Map<string, Setting>()
    }

    const settingRepo = dataSource.getRepository(Setting)
    const settings = await settingRepo.find({ where: { key: In(lookupKeys) } })
    return new Map<string, Setting>(settings.map((setting) => [setting.key, setting]))
}

async function findSettingRecord(key: string) {
    const settingsMap = await fetchSettingsMap([key])
    return resolveSettingRecordFromMap(settingsMap, key)
}

function normalizeSettingValue(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value)
    }

    try {
        return JSON.stringify(value)
    } catch {
        return null
    }
}

function inferSettingLevel(key: string, explicitLevel?: unknown) {
    if (isInternalOnlySettingKey(key)) {
        return 3
    }

    return resolveSettingLevel(key, explicitLevel)
}

function createEmptyLocalizedResolvedSetting<T extends LocalizedSettingScalar = string>(
    key: SettingKey | string,
    requestedLocale: ReturnType<typeof resolveRequestedAppLocale>,
    fallbackChain: ReturnType<typeof getLocalizedFallbackChain>,
): ResolvedLocalizedSetting<T> {
    return {
        key,
        value: null,
        requestedLocale,
        resolvedLocale: null,
        fallbackChain,
        usedFallback: false,
        usedLegacyValue: false,
    }
}

function resolveLocalizedSettingFromRawValue<T extends LocalizedSettingScalar = string>(
    key: SettingKey | string,
    rawValue: string | null | undefined,
    requestedLocale: ReturnType<typeof resolveRequestedAppLocale>,
    fallbackChain: ReturnType<typeof getLocalizedFallbackChain>,
): ResolvedLocalizedSetting<T> {
    const definition = getLocalizedSettingDefinition(key)

    if (!definition || typeof rawValue !== 'string' || rawValue.trim().length === 0) {
        return createEmptyLocalizedResolvedSetting<T>(key, requestedLocale, fallbackChain)
    }

    const parsedState = parseStoredLocalizedSettingValue(key, rawValue)

    if (!parsedState) {
        return createEmptyLocalizedResolvedSetting<T>(key, requestedLocale, fallbackChain)
    }

    if (parsedState.payload) {
        for (const candidateLocale of fallbackChain) {
            const localeValue = readLocalizedLocaleValue(parsedState.payload, candidateLocale)
            if (hasMeaningfulLocalizedValue(localeValue)) {
                return {
                    key,
                    value: localeValue as T,
                    requestedLocale,
                    resolvedLocale: candidateLocale,
                    fallbackChain,
                    usedFallback: candidateLocale !== requestedLocale,
                    usedLegacyValue: false,
                }
            }
        }
    }

    if (hasMeaningfulLocalizedValue(parsedState.legacyValue)) {
        return {
            key,
            value: parsedState.legacyValue as T,
            requestedLocale,
            resolvedLocale: 'legacy',
            fallbackChain,
            usedFallback: true,
            usedLegacyValue: true,
        }
    }

    return createEmptyLocalizedResolvedSetting<T>(key, requestedLocale, fallbackChain)
}

function createResolvedSettingItem(
    key: string,
    dbSetting?: Setting | null,
    explicitDefaultValue?: unknown,
): SettingResolvedItem {
    const effectiveDbSetting = isInternalOnlySettingKey(key) ? null : dbSetting
    const { envKey, value: envValue } = resolveSettingEnvEntry(key)
    const defaultValue = normalizeResolvedSettingValue(key, explicitDefaultValue) ?? normalizeResolvedSettingValue(key, getSettingDefaultValue(key))

    let rawValue: unknown = defaultValue
    let source: SettingResolvedItem['source'] = 'default'

    if (envValue !== undefined) {
        rawValue = envValue
        source = 'env'
    } else if (effectiveDbSetting?.value !== null && effectiveDbSetting?.value !== undefined) {
        rawValue = effectiveDbSetting.value
        source = 'db'
    }

    const value = normalizeResolvedSettingValue(key, rawValue) ?? ''
    let rawStringValue: string | null = null

    if (typeof rawValue === 'string') {
        rawStringValue = rawValue
    } else if (typeof value === 'string') {
        rawStringValue = value
    }

    const maskType = resolveSettingMaskType(key, rawStringValue ?? '', effectiveDbSetting?.maskType)
    const level = inferSettingLevel(key, effectiveDbSetting?.level)

    return {
        key,
        value,
        description: effectiveDbSetting?.description ?? '',
        level,
        maskType,
        source,
        isLocked: isSettingEnvLocked(key),
        envKey,
        defaultValue,
        defaultUsed: source === 'default',
        lockReason: getSettingLockReason(key),
        requiresRestart: doesSettingRequireRestart(key),
        localized: getLocalizedSettingMetadata(key, rawStringValue),
    }
}

export async function resolveSetting(key: SettingKey | string, defaultValue: unknown = null) {
    if (!dataSource.isInitialized) {
        return createResolvedSettingItem(key, null, defaultValue)
    }

    try {
        const setting = await findSettingRecord(key)
        return createResolvedSettingItem(key, setting, defaultValue)
    } catch (error) {
        logger.error(`Failed to resolve setting ${key} from database:`, error)
        return createResolvedSettingItem(key, null, defaultValue)
    }
}

export const resolveSettings = async (keys: (SettingKey | string)[]) => {
    const result: SettingResolvedItem[] = []

    if (!dataSource.isInitialized) {
        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key))
        })
        return result
    }

    try {
        const settingsMap = await fetchSettingsMap(keys)

        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key, resolveSettingRecordFromMap(settingsMap, key)))
        })
    } catch (error) {
        logger.error('Failed to resolve settings from database:', error)
        keys.forEach((key) => {
            result.push(createResolvedSettingItem(key))
        })
    }

    return result
}

/**
 * 获取指定键的设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param key 设置键名
 * @param defaultValue 默认值 (当环境变量和数据库都没有时返回)
 * @returns 设置值
 */
export async function getSetting<T = string>(key: SettingKey | string, defaultValue: T | null = null): Promise<string | T | null> {
    // 优先从环境变量获取
    const { value: envValue } = resolveSettingEnvEntry(key)
    if (envValue !== undefined) {
        return envValue
    }

    if (isInternalOnlySettingKey(key)) {
        return defaultValue
    }

    // 如果数据库未初始化，返回默认值
    if (!dataSource.isInitialized) {
        return defaultValue
    }

    try {
        const setting = await findSettingRecord(key)
        return setting?.value ?? (defaultValue as any)
    } catch (error) {
        logger.error(`Failed to get setting ${key} from database:`, error)
        return defaultValue
    }
}

/**
 * 获取多个设置值
 * 遵循优先从环境变量获取，其次数据库的原则
 *
 * @param keys 设置键名数组
 * @returns 键值对对象
 */
export const getSettings = async (keys: (SettingKey | string)[]): Promise<Record<string, string | null>> => {
    const result: Record<string, string | null> = {}

    // 初始化默认值，优先从环境变量获取
    keys.forEach((key) => {
        const { value } = resolveSettingEnvEntry(key)
        if (value !== undefined) {
            result[key] = value
        } else {
            result[key] = null
        }
    })

    // 如果数据库未初始化，直接返回从环境变量获取的结果
    if (!dataSource.isInitialized) {
        return result
    }

    try {
        const unresolvedKeys = keys.filter((key) => result[key] === null && !isInternalOnlySettingKey(key))
        if (unresolvedKeys.length === 0) {
            return result
        }

        const settingsMap = await fetchSettingsMap(unresolvedKeys)

        keys.forEach((key) => {
            const setting = resolveSettingRecordFromMap(settingsMap, key)
            if (result[key] === null && setting && !isInternalOnlySettingKey(setting.key)) {
                result[key] = setting.value
            }
        })
    } catch (error) {
        logger.error('Failed to get settings from database:', error)
    }

    return result
}

export async function getLocalizedSetting<T extends LocalizedSettingScalar = string>(
    key: SettingKey | string,
    locale?: string | null,
): Promise<ResolvedLocalizedSetting<T>> {
    const requestedLocale = resolveRequestedAppLocale(locale)
    const fallbackChain = getLocalizedFallbackChain(requestedLocale)
    const rawValue = await getSetting<string>(key, null)

    return resolveLocalizedSettingFromRawValue<T>(key, rawValue, requestedLocale, fallbackChain)
}

export async function getLocalizedSettings(
    keys: (SettingKey | string)[],
    locale?: string | null,
): Promise<Record<string, ResolvedLocalizedSetting>> {
    const requestedLocale = resolveRequestedAppLocale(locale)
    const fallbackChain = getLocalizedFallbackChain(requestedLocale)
    const settings = await getSettings(keys)
    const entries = keys.map((key) => [
        key,
        resolveLocalizedSettingFromRawValue(key, settings[key], requestedLocale, fallbackChain),
    ] as const)
    return Object.fromEntries(entries)
}

/**
 * 设置或更新配置项
 *
 * @param key 设置键名
 * @param value 设置值
 * @param options 配置选项 (级别、描述、脱敏类型)
 */
export const setSetting = async (
    key: string,
    value: string | null,
    options?: {
        level?: number
        description?: string
        maskType?: string
    },
    auditContext?: SettingAuditContext,
) => {
    await setSettings({
        [key]: {
            value,
            description: options?.description,
            level: options?.level,
            maskType: options?.maskType,
        },
    }, auditContext)
}

/**
 * 获取所有设置项 (Admin 仅限)
 * @param includeSecrets 是否包含机密信息 (level 3)
 * @param shouldMask 是否执行脱敏
 */
export const getAllSettings = async (options?: { includeSecrets?: boolean, shouldMask?: boolean }) => {
    const settingRepo = dataSource.getRepository(Setting)
    // 先读取全部数据库记录，再按归一化后的 level 过滤，避免旧数据在查询阶段被提前排除。
    const dbSettings: Setting[] = await settingRepo.createQueryBuilder('setting').getMany()
    const dbSettingsMap = new Map<string, Setting>(dbSettings.map((s: Setting) => [s.key, s]))

    // 确保所有在 SETTING_ENV_MAP 中定义的键都能出现在列表中，即使数据库中不存在
    const allKeys = new Set<string>([...Object.keys(SETTING_ENV_MAP), ...dbSettingsMap.keys()])

    const result: Omit<SettingResolvedItem, 'defaultValue'>[] = []
    for (const key of allKeys) {
        if (isLegacyOnlySettingKey(key)) {
            continue
        }

        // 如果是极端敏感的内部键，则完全跳过，不在 UI 展示
        if (isInternalOnlySettingKey(key)) {
            continue
        }

        const dbSetting = resolveSettingRecordFromMap(dbSettingsMap, key)

        const resolved = createResolvedSettingItem(key, dbSetting)

        if (!options?.includeSecrets && resolved.level >= 3) {
            continue
        }

        const maskedValue = options?.shouldMask && typeof resolved.value === 'string'
            ? maskSettingValue(resolved.value ?? '', resolved.maskType)
            : resolved.value

        result.push({
            key,
            value: maskedValue,
            description: resolved.description,
            level: resolved.level,
            maskType: resolved.maskType,
            source: resolved.source,
            isLocked: resolved.isLocked,
            envKey: resolved.envKey,
            defaultUsed: resolved.defaultUsed,
            lockReason: resolved.lockReason,
            requiresRestart: resolved.requiresRestart,
            localized: resolved.localized ?? null,
        })
    }

    return result
}

/**
 * 批量设置配置项
 *
 * @param settings 键值对对象，key 也可以是对象包含具体属性
 */
export const setSettings = async (settings: Record<string, any>, auditContext?: SettingAuditContext) => {
    const settingRepo = dataSource.getRepository(Setting)
    const entries = Object.entries(settings)
    const auditChanges: SettingAuditChange[] = []

    for (const [key, val] of entries) {
        if (isInternalOnlySettingKey(key)) {
            logger.warn(`[Settings] Ignored attempt to persist internal-only setting: ${key}`)
            continue
        }

        if (isSettingEnvLocked(key)) {
            continue // 跳过锁定的配置项
        }

        const existingSetting = await findSettingRecord(key)
        let setting = existingSetting?.key === key ? existingSetting : null

        const value = isSettingWriteEnvelope(val) ? val.value : val
        const previousValue = existingSetting?.value ?? null
        const extraMaskType = isSettingWriteEnvelope(val) && typeof val.maskType === 'string' ? val.maskType : undefined
        const extraDescription = isSettingWriteEnvelope(val) ? val.description : undefined
        const extraLevel = isSettingWriteEnvelope(val) ? val.level : undefined
        const previousMaskType = resolveSettingMaskType(key, previousValue ?? '', existingSetting?.maskType ?? extraMaskType)
        const normalizedIncomingValue = normalizeSettingValue(value)
        const currentMaskType = resolveSettingMaskType(key, previousValue ?? '', existingSetting?.maskType)
        const isExistingMaskedPlaceholder = normalizedIncomingValue !== null
            && existingSetting !== null
            && existingSetting !== undefined
            && (
                isMaskedSettingPlaceholder(normalizedIncomingValue, existingSetting.maskType)
                || isMaskedSettingPlaceholder(normalizedIncomingValue, currentMaskType)
            )
        const nextValue: string | null = isExistingMaskedPlaceholder
            ? existingSetting.value
            : normalizedIncomingValue
        const nextMaskType = resolveSettingMaskType(key, nextValue ?? '', extraMaskType ?? existingSetting?.maskType)
        const nextLevel = inferSettingLevel(key, extraLevel ?? existingSetting?.level)

        if (setting) {
            // 如果是脱敏过的值且没有变化（即用户提交的是脱敏后的占位符），则跳过值更新
            if (!(normalizedIncomingValue !== null && (
                isMaskedSettingPlaceholder(normalizedIncomingValue, setting.maskType)
                || isMaskedSettingPlaceholder(normalizedIncomingValue, nextMaskType)
            ))) {
                setting.value = nextValue
            }

            if (extraDescription !== undefined) {
                setting.description = String(extraDescription)
            }
            setting.level = nextLevel
            setting.maskType = nextMaskType
        } else {
            setting = settingRepo.create({
                key,
                value: nextValue,
                description: String(extraDescription ?? ''),
                level: nextLevel,
                maskType: nextMaskType,
            })
        }
        await settingRepo.save(setting)

        const legacyKeys = getSettingLookupKeys(key).filter((lookupKey) => lookupKey !== key)
        if (legacyKeys.length > 0) {
            await settingRepo.delete({ key: In(legacyKeys) })
        }

        if (!existingSetting || previousValue !== nextValue || previousMaskType !== nextMaskType) {
            auditChanges.push({
                key,
                action: existingSetting ? 'update' : 'create',
                oldValue: previousValue,
                newValue: nextValue,
                maskType: nextMaskType,
                effectiveSource: getSettingEffectiveSource(key),
                isOverriddenByEnv: getSettingEffectiveSource(key) === 'env',
            })
        }
    }

    if (auditChanges.length > 0) {
        await recordSettingAuditLogs(auditChanges, auditContext)
    }
}
