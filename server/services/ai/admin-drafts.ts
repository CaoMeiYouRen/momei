import { dataSource } from '@/server/database'
import { AgreementContent } from '@/server/entities/agreement-content'
import { createAgreementVersion } from '@/server/services/agreement'
import { getLocalizedSettingDefinition } from '@/server/services/setting'
import { TextService } from '@/server/services/ai/text'
import { APP_LOCALE_CODES, type AppLocaleCode } from '@/i18n/config/locale-registry'
import type { AgreementType } from '@/types/agreement'
import { SettingKey } from '@/types/setting'
import type { LocalizedSettingScalar, LocalizedSettingValueV1 } from '@/types/setting'
import {
    cloneLocalizedSettingValue,
    createEmptyLocalizedSettingValue,
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
} from '@/utils/shared/localized-settings'

interface LocalizedSettingSource {
    locale: AppLocaleCode | 'legacy'
    value: LocalizedSettingScalar
}

function normalizeLocalizedSettingInput(
    key: SettingKey,
    value: LocalizedSettingValueV1 | string | null | undefined,
) {
    const definition = getLocalizedSettingDefinition(key)

    if (!definition) {
        throw createError({
            statusCode: 400,
            statusMessage: `Setting ${key} is not localized`,
        })
    }

    if (isLocalizedSettingValue(value, definition.valueType)) {
        return cloneLocalizedSettingValue(value)
    }

    const legacyValue = typeof value === 'string'
        ? normalizeLocalizedLegacyValue(value, definition.valueType)
        : null

    return createEmptyLocalizedSettingValue(definition.valueType, legacyValue)
}

function resolveLocalizedSettingSource(
    value: LocalizedSettingValueV1,
    targetLocale: string,
    sourceLocale?: string | null,
): LocalizedSettingSource | null {
    const requestedTargetLocale = resolveRequestedAppLocale(targetLocale)
    const explicitSourceLocale = sourceLocale ? resolveRequestedAppLocale(sourceLocale) : null

    if (explicitSourceLocale) {
        const explicitSourceValue = readLocalizedLocaleValue(value, explicitSourceLocale)
        if (explicitSourceValue !== null) {
            return {
                locale: explicitSourceLocale,
                value: explicitSourceValue,
            }
        }
    }

    const candidateLocales = Array.from(new Set<AppLocaleCode>([
        ...getLocalizedFallbackChain(requestedTargetLocale),
        ...Object.keys(value.locales).filter((locale): locale is AppLocaleCode => APP_LOCALE_CODES.includes(locale as AppLocaleCode)),
    ]))

    for (const candidateLocale of candidateLocales) {
        if (candidateLocale === requestedTargetLocale) {
            continue
        }

        const candidateValue = readLocalizedLocaleValue(value, candidateLocale)
        if (candidateValue !== null) {
            return {
                locale: candidateLocale,
                value: candidateValue,
            }
        }
    }

    const legacyValue = value.legacyValue
    if (legacyValue !== null && legacyValue !== undefined && hasMeaningfulLocalizedValue(legacyValue)) {
        return {
            locale: 'legacy',
            value: legacyValue,
        }
    }

    return null
}

export async function generateLocalizedSettingDraft(options: {
    key: SettingKey
    targetLocale: string
    sourceLocale?: string | null
    value: LocalizedSettingValueV1 | string | null | undefined
    userId: string
}) {
    const definition = getLocalizedSettingDefinition(options.key)
    if (!definition) {
        throw createError({
            statusCode: 400,
            statusMessage: `Setting ${options.key} is not localized`,
        })
    }

    const normalizedValue = normalizeLocalizedSettingInput(options.key, options.value)
    const targetLocale = resolveRequestedAppLocale(options.targetLocale)
    const source = resolveLocalizedSettingSource(normalizedValue, targetLocale, options.sourceLocale)

    if (!source) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No source content available for AI draft generation',
        })
    }

    const nextValue = cloneLocalizedSettingValue(normalizedValue)
    let generatedValue: LocalizedSettingScalar

    if (definition.valueType === 'localized-string-list') {
        const sourceList = Array.isArray(source.value) ? source.value : []
        if (sourceList.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No source keywords available for AI draft generation',
            })
        }

        generatedValue = await TextService.translateNames(sourceList, targetLocale, options.userId)
    } else {
        const sourceText = typeof source.value === 'string' ? source.value : ''
        if (sourceText.trim().length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No source text available for AI draft generation',
            })
        }

        generatedValue = await TextService.translate(sourceText, targetLocale, options.userId, {
            sourceLanguage: source.locale === 'legacy' ? undefined : source.locale,
            field: options.key === SettingKey.SITE_TITLE ? 'title' : 'summary',
        })
    }

    nextValue.locales[targetLocale] = generatedValue as never

    return {
        key: options.key,
        targetLocale,
        sourceLocale: source.locale,
        value: nextValue,
        generatedValue,
    }
}

export async function generateAgreementTranslationDraft(options: {
    type: AgreementType
    sourceAgreementId: string
    targetLanguage: string
    version?: string | null
    versionDescription?: string | null
    userId: string
}) {
    const repo = dataSource.getRepository(AgreementContent)
    const sourceAgreement = await repo.findOne({ where: { id: options.sourceAgreementId, type: options.type } })

    if (!sourceAgreement) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Source agreement not found',
        })
    }

    if (sourceAgreement.language === options.targetLanguage) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Target language must differ from the source agreement language',
        })
    }

    const content = await TextService.translate(sourceAgreement.content, options.targetLanguage, options.userId, {
        sourceLanguage: sourceAgreement.language,
        field: 'content',
    })

    return await createAgreementVersion({
        type: options.type,
        language: options.targetLanguage,
        content,
        version: options.version ?? null,
        versionDescription: options.versionDescription ?? null,
        sourceAgreementId: sourceAgreement.id,
        reviewStatus: 'draft',
    })
}
