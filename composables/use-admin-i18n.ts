import { ref } from 'vue'

const contentLanguage = ref<string | null>(null)

interface AdminI18nLocaleOption {
    code: string
}

function isAdminI18nLocaleOption(value: unknown): value is AdminI18nLocaleOption {
    return typeof value === 'object' && value !== null
        && 'code' in value
        && typeof value.code === 'string'
}

export function useAdminI18n() {
    const { locales, t } = useI18n()

    const setContentLanguage = (lang: string | null) => {
        contentLanguage.value = lang
    }

    const availableLocales = computed(() => [
        { label: t('common.all_languages'), value: null },
        ...(Array.isArray(locales.value) ? locales.value : []).filter(isAdminI18nLocaleOption).map((locale) => ({
            label: t(`common.languages.${locale.code}`),
            value: locale.code,
        })),
    ])

    return {
        contentLanguage,
        setContentLanguage,
        availableLocales,
    }
}
