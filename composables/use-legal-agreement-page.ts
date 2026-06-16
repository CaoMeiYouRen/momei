import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
            authoritativeVersionTag: t('pages.privacy_policy.authoritative_version_tag'),
            currentActiveTag: t('pages.privacy_policy.current_active_tag'),
            formatEffectiveDateLabel: (date: string) => t('pages.privacy_policy.effective_date_label', { date }),
            formatFallbackNotice: (language: string) => t('pages.privacy_policy.fallback_notice', { language }),
            formatLastUpdatedLabel: (date: string) => t('pages.privacy_policy.last_updated_label', { date }),
            formatReferenceTranslationNotice: (language: string, version: string) => t('pages.privacy_policy.reference_translation_notice', { language, version }),
            formatVersionLabel: (version: string) => t('pages.privacy_policy.version_label', { version }),
            historyNoDescription: t('pages.privacy_policy.history_no_description'),
            historyTitle: t('pages.privacy_policy.history_title'),
            legalNotice: t('legal.notice'),
            referenceTranslationTag: t('pages.privacy_policy.reference_translation_tag'),
            title: t('pages.privacy_policy.title'),
            versionFallback: t('pages.privacy_policy.version_fallback'),
        }
    }

    return {
        authoritativeVersionTag: t('pages.user_agreement.authoritative_version_tag'),
        currentActiveTag: t('pages.user_agreement.current_active_tag'),
        formatEffectiveDateLabel: (date: string) => t('pages.user_agreement.effective_date_label', { date }),
        formatFallbackNotice: (language: string) => t('pages.user_agreement.fallback_notice', { language }),
        formatLastUpdatedLabel: (date: string) => t('pages.user_agreement.last_updated_label', { date }),
        formatReferenceTranslationNotice: (language: string, version: string) => t('pages.user_agreement.reference_translation_notice', { language, version }),
        formatVersionLabel: (version: string) => t('pages.user_agreement.version_label', { version }),
        historyNoDescription: t('pages.user_agreement.history_no_description'),
        historyTitle: t('pages.user_agreement.history_title'),
        legalNotice: t('legal.notice'),
        referenceTranslationTag: t('pages.user_agreement.reference_translation_tag'),
        title: t('pages.user_agreement.title'),
        versionFallback: t('pages.user_agreement.version_fallback'),
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

        return new Intl.DateTimeFormat(locale.value, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(value))
    }

    return {
        agreement,
        copy,
        formatDate,
    }
}
