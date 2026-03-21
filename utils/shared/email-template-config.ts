import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import {
    createEmptyLocalizedSettingValue,
    getLocalizedFallbackChain,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    readLocalizedLocaleValue,
    resolveRequestedAppLocale,
} from '@/utils/shared/localized-settings'
import type { LocalizedSettingValueV1 } from '@/types/setting'

export const EMAIL_TEMPLATE_IDS = [
    'verification',
    'passwordReset',
    'loginOTP',
    'emailVerificationOTP',
    'passwordResetOTP',
    'magicLink',
    'emailChangeVerification',
    'securityNotification',
    'subscriptionConfirmation',
    'marketingCampaign',
] as const

export type EmailTemplateId = typeof EMAIL_TEMPLATE_IDS[number]

export const EMAIL_TEMPLATE_FIELD_IDS = [
    'title',
    'preheader',
    'message',
    'buttonText',
    'reminderContent',
    'securityTip',
    'authorLabel',
    'categoryLabel',
    'dateLabel',
] as const

export type EmailTemplateFieldId = typeof EMAIL_TEMPLATE_FIELD_IDS[number]

export type EmailTemplateKind = 'action' | 'code' | 'simple' | 'marketing'

export interface EmailTemplateDefinition {
    id: EmailTemplateId
    kind: EmailTemplateKind
    editableFields: readonly EmailTemplateFieldId[]
    variables: readonly string[]
}

export const EMAIL_TEMPLATE_DEFINITIONS: Record<EmailTemplateId, EmailTemplateDefinition> = {
    verification: {
        id: 'verification',
        kind: 'action',
        editableFields: ['title', 'preheader', 'message', 'buttonText', 'reminderContent', 'securityTip'],
        variables: ['appName'],
    },
    passwordReset: {
        id: 'passwordReset',
        kind: 'action',
        editableFields: ['title', 'preheader', 'message', 'buttonText', 'reminderContent', 'securityTip'],
        variables: ['appName'],
    },
    loginOTP: {
        id: 'loginOTP',
        kind: 'code',
        editableFields: ['title', 'preheader', 'message', 'securityTip'],
        variables: ['appName', 'expiresIn'],
    },
    emailVerificationOTP: {
        id: 'emailVerificationOTP',
        kind: 'code',
        editableFields: ['title', 'preheader', 'message', 'securityTip'],
        variables: ['appName', 'expiresIn'],
    },
    passwordResetOTP: {
        id: 'passwordResetOTP',
        kind: 'code',
        editableFields: ['title', 'preheader', 'message', 'securityTip'],
        variables: ['appName', 'expiresIn'],
    },
    magicLink: {
        id: 'magicLink',
        kind: 'action',
        editableFields: ['title', 'preheader', 'message', 'buttonText', 'reminderContent', 'securityTip'],
        variables: ['appName'],
    },
    emailChangeVerification: {
        id: 'emailChangeVerification',
        kind: 'action',
        editableFields: ['title', 'preheader', 'message', 'buttonText', 'reminderContent', 'securityTip'],
        variables: ['appName'],
    },
    securityNotification: {
        id: 'securityNotification',
        kind: 'simple',
        editableFields: ['title', 'preheader', 'message'],
        variables: ['appName', 'contactEmail'],
    },
    subscriptionConfirmation: {
        id: 'subscriptionConfirmation',
        kind: 'action',
        editableFields: ['title', 'preheader', 'message', 'buttonText', 'reminderContent', 'securityTip'],
        variables: ['appName'],
    },
    marketingCampaign: {
        id: 'marketingCampaign',
        kind: 'marketing',
        editableFields: ['title', 'preheader', 'buttonText', 'authorLabel', 'categoryLabel', 'dateLabel'],
        variables: ['appName', 'title', 'summary'],
    },
}

export interface EmailTemplateTemplateConfig {
    enabled?: boolean
    fields?: Partial<Record<EmailTemplateFieldId, LocalizedSettingValueV1<string>>>
}

export interface EmailTemplateSettingsConfigV1 {
    version: 1
    templates: Partial<Record<EmailTemplateId, EmailTemplateTemplateConfig>>
}

export type EmailTemplateSettingsFormValue = string | EmailTemplateSettingsConfigV1 | null | undefined

export interface ResolvedEmailTemplateField {
    value: string | null
    resolvedLocale: AppLocaleCode | 'legacy' | null
    usedFallback: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmailTemplateId(value: unknown): value is EmailTemplateId {
    return typeof value === 'string' && EMAIL_TEMPLATE_IDS.includes(value as EmailTemplateId)
}

function isEmailTemplateFieldId(value: unknown): value is EmailTemplateFieldId {
    return typeof value === 'string' && EMAIL_TEMPLATE_FIELD_IDS.includes(value as EmailTemplateFieldId)
}

export function createEmptyEmailTemplateSettingsConfig(): EmailTemplateSettingsConfigV1 {
    return {
        version: 1,
        templates: {},
    }
}

function normalizeTemplateFields(rawFields: unknown): Partial<Record<EmailTemplateFieldId, LocalizedSettingValueV1<string>>> {
    if (!isRecord(rawFields)) {
        return {}
    }

    const result: Partial<Record<EmailTemplateFieldId, LocalizedSettingValueV1<string>>> = {}

    for (const [fieldId, fieldValue] of Object.entries(rawFields)) {
        if (!isEmailTemplateFieldId(fieldId)) {
            continue
        }

        if (isLocalizedSettingValue<string>(fieldValue, 'localized-text')) {
            result[fieldId] = fieldValue
            continue
        }

        if (typeof fieldValue === 'string') {
            result[fieldId] = createEmptyLocalizedSettingValue('localized-text', fieldValue) as LocalizedSettingValueV1<string>
        }
    }

    return result
}

export function parseEmailTemplateSettingsConfig(value: EmailTemplateSettingsFormValue): EmailTemplateSettingsConfigV1 {
    if (!value) {
        return createEmptyEmailTemplateSettingsConfig()
    }

    let rawValue: unknown = value
    if (typeof value === 'string') {
        try {
            rawValue = JSON.parse(value) as unknown
        } catch {
            return createEmptyEmailTemplateSettingsConfig()
        }
    }

    if (!isRecord(rawValue)) {
        return createEmptyEmailTemplateSettingsConfig()
    }

    const rawTemplates = isRecord(rawValue.templates) ? rawValue.templates : {}
    const templates: Partial<Record<EmailTemplateId, EmailTemplateTemplateConfig>> = {}

    for (const [templateId, templateValue] of Object.entries(rawTemplates)) {
        if (!isEmailTemplateId(templateId) || !isRecord(templateValue)) {
            continue
        }

        templates[templateId] = {
            enabled: templateValue.enabled === true,
            fields: normalizeTemplateFields(templateValue.fields),
        }
    }

    return {
        version: 1,
        templates,
    }
}

export function getEmailTemplateCustomConfig(
    config: EmailTemplateSettingsFormValue,
    templateId: EmailTemplateId,
): EmailTemplateTemplateConfig {
    const normalizedConfig = parseEmailTemplateSettingsConfig(config)
    return normalizedConfig.templates[templateId] ?? {}
}

export function updateEmailTemplateCustomConfig(
    config: EmailTemplateSettingsFormValue,
    templateId: EmailTemplateId,
    nextConfig: EmailTemplateTemplateConfig,
): EmailTemplateSettingsConfigV1 {
    const normalizedConfig = parseEmailTemplateSettingsConfig(config)

    return {
        version: 1,
        templates: {
            ...normalizedConfig.templates,
            [templateId]: {
                enabled: nextConfig.enabled === true,
                fields: normalizeTemplateFields(nextConfig.fields),
            },
        },
    }
}

export function resolveEmailTemplateLocalizedField(
    value: LocalizedSettingValueV1<string> | null | undefined,
    locale?: string | null,
): ResolvedEmailTemplateField {
    const requestedLocale = resolveRequestedAppLocale(locale)

    if (!value) {
        return {
            value: null,
            resolvedLocale: null,
            usedFallback: false,
        }
    }

    for (const candidateLocale of getLocalizedFallbackChain(requestedLocale)) {
        const localeValue = readLocalizedLocaleValue(value, candidateLocale)
        if (hasMeaningfulLocalizedValue(localeValue)) {
            return {
                value: localeValue,
                resolvedLocale: candidateLocale,
                usedFallback: candidateLocale !== requestedLocale,
            }
        }
    }

    if (hasMeaningfulLocalizedValue(value.legacyValue)) {
        const legacyValue = typeof value.legacyValue === 'string' ? value.legacyValue : null

        return {
            value: legacyValue,
            resolvedLocale: 'legacy',
            usedFallback: true,
        }
    }

    return {
        value: null,
        resolvedLocale: null,
        usedFallback: false,
    }
}
