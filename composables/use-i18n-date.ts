import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate as _formatDate, formatDateTime as _formatDateTime, getRelativeTime, isFutureDate } from '@/utils/shared/date'
import { authClient } from '@/lib/auth-client'

/**
 * 将 i18n 的 locale 转换为日期库（如 dayjs）识别的 locale
 */
const dateLocaleMap: Record<string, string> = {
    'zh-CN': 'zh-cn',
    'en-US': 'en',
    'zh-TW': 'zh-tw',
    'ko-KR': 'ko',
    'ja-JP': 'ja',
}

export function useI18nDate() {
    const { locale } = useI18n()
    const session = authClient.useSession()

    const userTimezone = computed(() => {
        const user = session.value?.data?.user
        if (typeof user === 'object' && user !== null && 'timezone' in user && typeof user.timezone === 'string') {
            return user.timezone
        }

        return undefined
    })
    const currentLocale = computed(() => dateLocaleMap[locale.value] || locale.value.toLowerCase())

    const formatDate = (date: string | number | Date | null | undefined, format?: string) => {
        if (!date) {
            return '-'
        }
        return _formatDate(date, format, currentLocale.value, userTimezone.value)
    }

    const formatDateTime = (date: string | number | Date | null | undefined, format?: string) => {
        if (!date) {
            return '-'
        }
        return _formatDateTime(date, format, currentLocale.value, userTimezone.value)
    }

    const relativeTime = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return '-'
        }
        return getRelativeTime(date, {
            locale: currentLocale.value,
            tz: userTimezone.value,
        })
    }

    const isFuture = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return false
        }

        return isFutureDate(date, new Date(), userTimezone.value)
    }

    return {
        formatDate,
        formatDateTime,
        relativeTime,
        isFuture,
        d: formatDateTime, // Alias for template usage
    }
}
