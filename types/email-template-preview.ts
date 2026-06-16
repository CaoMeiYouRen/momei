import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import type {
    EmailTemplateFieldId,
} from '@/utils/shared/email-template-config'
import type { SettingKey, SettingSource } from '@/types/setting'

/**
 * 邮件模板预览相关的纯接口定义。
 * 从 `utils/shared/email-template-preview.ts` 迁入至 `types/`，因为它仅包含 interface 定义，无任何运行时逻辑。
 */
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

export interface EmailTemplatePreviewPayload {
    html: string
    text: string
    subject: string
    meta: EmailTemplatePreviewMeta
}
