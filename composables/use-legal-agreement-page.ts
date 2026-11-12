import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate as _formatDate } from '@/utils/shared/date'
import { dateLocaleMap } from '@/composables/use-i18n-date'
import type { ApiResponse } from '@/types/api'
import type { AgreementPublicPayload } from '@/types/agreement'

interface UseLegalAgreementPageOptions {
    agreementType: AgreementPublicPayload['type']
    defaultContent: string
    endpoint: string
}

function createLegalAgreementPageCopy(t: ReturnType<typeof useI18n>['t'], agreementType: AgreementPublicPayload['type']) {
    if (agreementType === 'privacy_policy') {
        return {
            authoritativeVersionTag: t('legal.authoritative_version_tag'),
            currentActiveTag: t('legal.current_active_tag'),
            formatEffectiveDateLabel: (date: string) => t('legal.effective_date_label', { date }),
            formatFallbackNotice: (language: string) => t('legal.fallback_notice', { language }),
            formatLastUpdatedLabel: (date: string) => t('legal.last_updated_label', { date }),
            formatReferenceTranslationNotice: (language: string, version: string) => t('legal.reference_translation_notice', { language, version }),
            formatVersionLabel: (version: string) => t('legal.version_label', { version }),
            historyNoDescription: t('legal.history_no_description'),
            historyTitle: t('legal.history_title'),
            legalNotice: t('legal.notice'),
            referenceTranslationTag: t('legal.reference_translation_tag'),
            title: t('pages.privacy_policy.title'),
            versionFallback: t('legal.version_fallback'),
        }
    }

    return {
        authoritativeVersionTag: t('legal.authoritative_version_tag'),
        currentActiveTag: t('legal.current_active_tag'),
        formatEffectiveDateLabel: (date: string) => t('legal.effective_date_label', { date }),
        formatFallbackNotice: (language: string) => t('legal.fallback_notice', { language }),
        formatLastUpdatedLabel: (date: string) => t('legal.last_updated_label', { date }),
        formatReferenceTranslationNotice: (language: string, version: string) => t('legal.reference_translation_notice', { language, version }),
        formatVersionLabel: (version: string) => t('legal.version_label', { version }),
        historyNoDescription: t('legal.history_no_description'),
        historyTitle: t('legal.history_title'),
        legalNotice: t('legal.notice'),
        referenceTranslationTag: t('legal.reference_translation_tag'),
        title: t('pages.user_agreement.title'),
        versionFallback: t('legal.version_fallback'),
    }
}

export async function useLegalAgreementPage(options: UseLegalAgreementPageOptions) {
    const { agreementType, defaultContent, endpoint } = options
    const { t, locale } = useI18n()

    const descriptionKey = agreementType === 'privacy_policy'
        ? 'pages.privacy_policy.meta.description'
        : 'pages.user_agreement.meta.description'

    const titleKey = agreementType === 'privacy_policy'
        ? 'pages.privacy_policy.title'
        : 'pages.user_agreement.title'

    usePageSeo({
        type: 'website',
        title: () => t(titleKey),
        description: () => t(descriptionKey),
    })

    const fallbackAgreement = computed<AgreementPublicPayload>(() => ({
        id: 'default',
        type: agreementType,
        language: locale.value,
        content: defaultContent,
        version: null,
        versionDescription: null,
        effectiveAt: null,
        updatedAt: null,
        authoritativeLanguage: 'zh-CN',
        authoritativeVersion: null,
        isDefault: true,
        isReferenceTranslation: false,
        fallbackToAuthoritative: false,
        sourceAgreementId: null,
        sourceAgreementVersion: null,
        history: [],
    }))

    const { data } = await useAsyncData(
        () => `${endpoint}:${locale.value}`,
        () => $fetch<ApiResponse<AgreementPublicPayload>>(`/api/agreements/${endpoint}`, {
            query: {
                language: locale.value,
            },
        }),
        {
            watch: [locale],
        },
    )

    const agreement = computed(() => data.value?.data || fallbackAgreement.value)
    const copy = computed(() => createLegalAgreementPageCopy(t, agreementType))

    function formatDate(value?: null | string) {
        if (!value) {
            return agreementType === 'privacy_policy'
                ? t('pages.privacy_policy.date_fallback')
                : t('pages.user_agreement.date_fallback')
        }

        return _formatDate(value, 'll', dateLocaleMap[locale.value] || locale.value.toLowerCase())
    }

    return {
        agreement,
        copy,
        formatDate,
    }
}
