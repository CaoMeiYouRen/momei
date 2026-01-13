import { ref } from 'vue'

const contentLanguage = ref<string | null>(null)

export function useAdminI18n() {
    const { locale, locales, t } = useI18n()

    // Initialize with current locale if not set
    if (!contentLanguage.value) {
        contentLanguage.value = locale.value
    }

    const setContentLanguage = (lang: string | null) => {
        contentLanguage.value = lang
    }

    const availableLocales = computed(() => [
        { label: t('common.all_languages'), value: null },
        ...locales.value.map((l: any) => ({
            label: t(`common.languages.${l.code}`),
            value: l.code,
        })),
    ])

    return {
        contentLanguage,
        setContentLanguage,
        availableLocales,
    }
}
