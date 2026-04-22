import { loadLocaleMessages } from '@/server/utils/i18n'
import { emailI18n } from '@/server/utils/email/i18n'
import { emailTemplateEngine } from '@/server/utils/email/templates'
import { plainTextToHtml } from '@/server/utils/html'
import { getLocalizedSetting, getSetting, resolveSetting } from '@/server/services/setting'
import { SettingKey, type SettingSource } from '@/types/setting'
import {
    EMAIL_TEMPLATE_DEFINITIONS,
    EMAIL_TEMPLATE_IDS,
    type EmailTemplateFieldId,
    type EmailTemplateId,
    type EmailTemplateSettingsFormValue,
    parseEmailTemplateSettingsConfig,
    resolveEmailTemplateLocalizedField,
} from '@/utils/shared/email-template-config'
import { type AppLocaleCode } from '@/i18n/config/locale-registry'
import { resolveRequestedAppLocale } from '@/utils/shared/localized-settings'

type LocaleMessages = Record<string, any>

export interface EmailTemplateRuntimeContent {
    title: string
    preheader: string
    headerIcon: string
    message: string
    buttonText?: string
    reminderContent?: string
    securityTip?: string
    authorLabel?: string
    categoryLabel?: string
    dateLabel?: string
}

export interface EmailTemplatePreviewPayload {
    html: string
    text: string
    subject: string
    meta: EmailTemplatePreviewMeta
}

export interface EmailTemplatePreviewVariableMeta {
    value: string
    source: SettingSource
    settingKey: SettingKey
    resolvedLocale: AppLocaleCode | 'legacy' | null
}

export interface EmailTemplatePreviewFieldSourceMeta {
    source: 'default' | 'db'
    resolvedLocale: AppLocaleCode | 'legacy' | null
    usedFallback: boolean
}

export interface EmailTemplatePreviewMeta {
    locale: AppLocaleCode
    appName: EmailTemplatePreviewVariableMeta
    fieldSources: Partial<Record<EmailTemplateFieldId, EmailTemplatePreviewFieldSourceMeta>>
}

interface EmailTemplatePreviewSamples {
    title: string
    summary: string
    action: string
    details: string
    authorName: string
    categoryName: string
}

function getNestedValue(obj: Record<string, any>, path: string): unknown {
    return path.split('.').reduce<any>((current, key) => current?.[key], obj) ?? null
}

function replaceTemplateParameters(text: string, params: Record<string, string | number>): string {
    let result = text
    for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }
    return result
}

async function loadEmailTemplateMessages(locale?: string | null): Promise<LocaleMessages> {
    return loadLocaleMessages(resolveRequestedAppLocale(locale))
}

function resolveLegacyRuntimeContent(templateId: EmailTemplateId, locale?: string | null): EmailTemplateRuntimeContent | null {
    const legacyContent = emailI18n.getText(templateId, locale ?? undefined)
    if (!legacyContent) {
        return null
    }

    let message = ''
    if ('message' in legacyContent) {
        message = legacyContent.message
    } else if ('greeting' in legacyContent) {
        message = legacyContent.greeting
    }

    return {
        title: legacyContent.title,
        preheader: legacyContent.preheader,
        headerIcon: legacyContent.headerIcon,
        message,
        buttonText: 'buttonText' in legacyContent ? legacyContent.buttonText : undefined,
        reminderContent: 'reminderContent' in legacyContent ? legacyContent.reminderContent : undefined,
        securityTip: 'securityTip' in legacyContent ? legacyContent.securityTip : undefined,
        authorLabel: 'author' in legacyContent ? legacyContent.author : undefined,
        categoryLabel: 'category' in legacyContent ? legacyContent.category : undefined,
        dateLabel: 'publishedAt' in legacyContent ? legacyContent.publishedAt : undefined,
    }
}

async function loadDefaultRuntimeContent(templateId: EmailTemplateId, locale?: string | null): Promise<EmailTemplateRuntimeContent> {
    const messages = await loadEmailTemplateMessages(locale)
    const basePath = `pages.admin.settings.system.email_templates.catalog.${templateId}.defaults`

    const i18nContent = getNestedValue(messages, basePath) as Partial<EmailTemplateRuntimeContent> | null
    const legacyContent = resolveLegacyRuntimeContent(templateId, locale)

    return {
        title: i18nContent?.title ?? legacyContent?.title ?? '',
        preheader: i18nContent?.preheader ?? legacyContent?.preheader ?? '',
        headerIcon: i18nContent?.headerIcon ?? legacyContent?.headerIcon ?? '✉️',
        message: i18nContent?.message ?? legacyContent?.message ?? '',
        buttonText: i18nContent?.buttonText ?? legacyContent?.buttonText,
        reminderContent: i18nContent?.reminderContent ?? legacyContent?.reminderContent,
        securityTip: i18nContent?.securityTip ?? legacyContent?.securityTip,
        authorLabel: i18nContent?.authorLabel ?? legacyContent?.authorLabel,
        categoryLabel: i18nContent?.categoryLabel ?? legacyContent?.categoryLabel,
        dateLabel: i18nContent?.dateLabel ?? legacyContent?.dateLabel,
    }
}

async function resolveTemplateVariableContext(locale?: string | null) {
    const requestedLocale = resolveRequestedAppLocale(locale)
    const [localizedSiteTitle, resolvedSiteTitle, resolvedSiteName, resolvedContactEmail] = await Promise.all([
        getLocalizedSetting(SettingKey.SITE_TITLE, requestedLocale),
        resolveSetting(SettingKey.SITE_TITLE),
        resolveSetting(SettingKey.SITE_NAME),
        resolveSetting(SettingKey.CONTACT_EMAIL),
    ])

    const localizedSiteTitleValue = typeof localizedSiteTitle.value === 'string'
        ? localizedSiteTitle.value.trim()
        : ''
    const siteNameValue = typeof resolvedSiteName.value === 'string'
        ? resolvedSiteName.value.trim()
        : ''
    const contactEmailValue = typeof resolvedContactEmail.value === 'string'
        ? resolvedContactEmail.value.trim()
        : ''

    const appName = localizedSiteTitleValue || siteNameValue || 'Momei'
    let appNameSource: SettingSource = 'default'
    if (localizedSiteTitleValue) {
        appNameSource = resolvedSiteTitle.source
    } else if (siteNameValue) {
        appNameSource = resolvedSiteName.source
    }

    return {
        locale: requestedLocale,
        appName: {
            value: appName,
            source: appNameSource,
            settingKey: localizedSiteTitleValue ? SettingKey.SITE_TITLE : SettingKey.SITE_NAME,
            resolvedLocale: localizedSiteTitleValue ? localizedSiteTitle.resolvedLocale : null,
        } satisfies EmailTemplatePreviewVariableMeta,
        contactEmail: {
            value: contactEmailValue || 'contact@momei.app',
            source: contactEmailValue ? resolvedContactEmail.source : 'default',
            settingKey: SettingKey.CONTACT_EMAIL,
            resolvedLocale: null,
        },
    }
}

async function loadPreviewSamples(locale: AppLocaleCode): Promise<EmailTemplatePreviewSamples> {
    const messages = await loadEmailTemplateMessages(locale)
    const samplePath = 'pages.admin.settings.system.email_templates.preview_samples'
    const samples = getNestedValue(messages, samplePath) as Partial<EmailTemplatePreviewSamples> | null

    return {
        title: samples?.title ?? 'Momei 版本更新',
        summary: samples?.summary ?? '最新版本摘要、精选文章与升级建议。',
        action: samples?.action ?? 'Chrome 浏览器登录',
        details: samples?.details ?? 'IP: 192.168.1.10\n地区: 东京\n时间: 2026-03-21 10:24',
        authorName: samples?.authorName ?? '草梅友仁',
        categoryName: samples?.categoryName ?? '工程实践',
    }
}

async function getStaticPreviewVariables(locale: AppLocaleCode) {
    const samples = await loadPreviewSamples(locale)

    return {
        expiresIn: 10,
        title: samples.title,
        summary: samples.summary,
        action: samples.action,
        details: samples.details,
        actionUrl: 'https://momei.app/preview/email-template',
        authorName: samples.authorName,
        categoryName: samples.categoryName,
        publishDate: '2026-03-21 10:24',
    }
}

function resolveTemplateFieldSources(
    templateId: EmailTemplateId,
    config: EmailTemplateSettingsFormValue,
    locale?: string | null,
): Partial<Record<EmailTemplateFieldId, EmailTemplatePreviewFieldSourceMeta>> {
    const normalizedConfig = parseEmailTemplateSettingsConfig(config)
    const templateConfig = normalizedConfig.templates[templateId]
    const fieldSources: Partial<Record<EmailTemplateFieldId, EmailTemplatePreviewFieldSourceMeta>> = {}

    for (const fieldId of EMAIL_TEMPLATE_DEFINITIONS[templateId].editableFields) {
        const resolvedField = resolveEmailTemplateLocalizedField(templateConfig?.fields?.[fieldId], locale)
        const usesDbValue = templateConfig?.enabled === true && Boolean(resolvedField.value)

        fieldSources[fieldId] = {
            source: usesDbValue ? 'db' : 'default',
            resolvedLocale: usesDbValue ? resolvedField.resolvedLocale : null,
            usedFallback: usesDbValue ? resolvedField.usedFallback : false,
        }
    }

    return fieldSources
}

function applyOverrides(
    defaults: EmailTemplateRuntimeContent,
    templateId: EmailTemplateId,
    config: EmailTemplateSettingsFormValue,
    locale?: string | null,
) {
    const normalizedConfig = parseEmailTemplateSettingsConfig(config)
    const templateConfig = normalizedConfig.templates[templateId]

    if (!templateConfig?.enabled || !templateConfig.fields) {
        return defaults
    }

    const nextContent = { ...defaults }

    for (const fieldId of EMAIL_TEMPLATE_DEFINITIONS[templateId].editableFields) {
        const resolvedField = resolveEmailTemplateLocalizedField(templateConfig.fields[fieldId], locale)
        if (resolvedField.value) {
            nextContent[fieldId as keyof EmailTemplateRuntimeContent] = resolvedField.value
        }
    }

    return nextContent
}

export async function getStoredEmailTemplateConfig(): Promise<string | null> {
    const value = await getSetting(SettingKey.EMAIL_TEMPLATE_CONFIGS, null)
    return typeof value === 'string' ? value : null
}

export async function resolveEmailTemplateRuntimeContent(options: {
    templateId: EmailTemplateId
    locale?: string | null
    config?: EmailTemplateSettingsFormValue
    params?: Record<string, string | number>
}) {
    const defaults = await loadDefaultRuntimeContent(options.templateId, options.locale)
    const storedConfig = options.config ?? await getStoredEmailTemplateConfig()
    const overridden = applyOverrides(defaults, options.templateId, storedConfig, options.locale)
    const variableContext = await resolveTemplateVariableContext(options.locale)
    const params = {
        ...(options.params ?? {}),
        appName: variableContext.appName.value,
        contactEmail: variableContext.contactEmail.value,
    }

    return {
        ...overridden,
        title: replaceTemplateParameters(overridden.title, params),
        preheader: replaceTemplateParameters(overridden.preheader, params),
        message: replaceTemplateParameters(overridden.message, params),
        buttonText: overridden.buttonText ? replaceTemplateParameters(overridden.buttonText, params) : undefined,
        reminderContent: overridden.reminderContent ? replaceTemplateParameters(overridden.reminderContent, params) : undefined,
        securityTip: overridden.securityTip ? replaceTemplateParameters(overridden.securityTip, params) : undefined,
        authorLabel: overridden.authorLabel ? replaceTemplateParameters(overridden.authorLabel, params) : undefined,
        categoryLabel: overridden.categoryLabel ? replaceTemplateParameters(overridden.categoryLabel, params) : undefined,
        dateLabel: overridden.dateLabel ? replaceTemplateParameters(overridden.dateLabel, params) : undefined,
    }
}

export async function previewEmailTemplate(options: {
    templateId: EmailTemplateId
    locale?: string | null
    config?: EmailTemplateSettingsFormValue
}): Promise<EmailTemplatePreviewPayload> {
    const locale = resolveRequestedAppLocale(options.locale)
    const variableContext = await resolveTemplateVariableContext(locale)
    const previewVariables = await getStaticPreviewVariables(locale)
    const params = {
        ...previewVariables,
        appName: variableContext.appName.value,
        contactEmail: variableContext.contactEmail.value,
    }
    const storedConfig = options.config ?? await getStoredEmailTemplateConfig()
    const content = await resolveEmailTemplateRuntimeContent({
        templateId: options.templateId,
        locale,
        config: storedConfig,
        params,
    })
    const meta: EmailTemplatePreviewMeta = {
        locale,
        appName: variableContext.appName,
        fieldSources: resolveTemplateFieldSources(options.templateId, storedConfig, locale),
    }

    switch (EMAIL_TEMPLATE_DEFINITIONS[options.templateId].kind) {
        case 'action': {
            const result = await emailTemplateEngine.generateActionEmailTemplate({
                headerIcon: content.headerIcon,
                message: content.message,
                buttonText: content.buttonText ?? '',
                actionUrl: params.actionUrl,
                reminderContent: content.reminderContent ?? '',
                securityTip: content.securityTip ?? '',
            }, {
                title: content.title,
                preheader: content.preheader,
                locale,
            })

            return {
                ...result,
                subject: content.title,
                meta,
            }
        }
        case 'code': {
            const result = await emailTemplateEngine.generateCodeEmailTemplate({
                headerIcon: content.headerIcon,
                message: content.message,
                verificationCode: '123456',
                expiresIn: Number(params.expiresIn),
                securityTip: content.securityTip ?? '',
            }, {
                title: content.title,
                preheader: content.preheader,
                locale,
            })

            return {
                ...result,
                subject: content.title,
                meta,
            }
        }
        case 'simple': {
            const result = await emailTemplateEngine.generateSimpleMessageTemplate({
                headerIcon: content.headerIcon,
                message: `${content.message}<br/><br/><strong>${params.action}</strong>`,
                extraInfo: plainTextToHtml(String(params.details)),
            }, {
                title: content.title,
                preheader: content.preheader,
                locale,
            })

            return {
                ...result,
                subject: content.title,
                meta,
            }
        }
        case 'marketing': {
            const result = await emailTemplateEngine.generateMarketingEmailTemplate({
                headerIcon: content.headerIcon,
                message: plainTextToHtml(String(params.summary)),
                articleTitle: String(params.title),
                authorLabel: content.authorLabel ?? '',
                authorName: String(params.authorName),
                categoryLabel: content.categoryLabel ?? '',
                categoryName: String(params.categoryName),
                dateLabel: content.dateLabel ?? '',
                publishDate: String(params.publishDate),
                buttonText: content.buttonText ?? '',
                actionUrl: String(params.actionUrl),
            }, {
                title: content.title,
                preheader: content.preheader,
                locale,
            })

            return {
                ...result,
                subject: content.title,
                meta,
            }
        }
    }
}

export function getSupportedEmailTemplateIds() {
    return [...EMAIL_TEMPLATE_IDS]
}

export function isSupportedEmailTemplateId(value: unknown): value is EmailTemplateId {
    return typeof value === 'string' && EMAIL_TEMPLATE_IDS.includes(value as EmailTemplateId)
}
