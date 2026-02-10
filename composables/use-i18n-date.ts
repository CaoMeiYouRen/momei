import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate as _formatDate, formatDateTime as _formatDateTime } from '@/utils/shared/date'
import { authClient } from '@/lib/auth-client'

/**
 * 将 i18n 的 locale 转换为日期库（如 dayjs）识别的 locale
 */
const dateLocaleMap: Record<string, string> = {
    'zh-CN': 'zh-cn',
    'en-US': 'en',
}

export function useI18nDate() {
    const { locale } = useI18n()
    const session = authClient.useSession()

    const userTimezone = computed(() => (session.value?.data?.user as any)?.timezone)
    const currentLocale = computed(() => dateLocaleMap[locale.value] || locale.value.toLowerCase())
    const currentIntlLocale = computed(() => locale.value)

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
        const d = new Date(date)
        const now = new Date()
        const diffMillis = d.getTime() - now.getTime() // 未来为正，过去为负
        const absDiff = Math.abs(diffMillis)
        const minutes = Math.floor(absDiff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        // 使用转换后的 Intl locale
        const rtf = new Intl.RelativeTimeFormat(currentIntlLocale.value, { numeric: 'auto' })

        // 如果相差超过 30 天，则直接显示日期
        if (days > 30) {
            return formatDate(date)
        }

        const sign = diffMillis > 0 ? 1 : -1

        if (days > 0) {
            return rtf.format(sign * days, 'day')
        }
        if (hours > 0) {
            return rtf.format(sign * hours, 'hour')
        }
        if (minutes > 0) {
            return rtf.format(sign * minutes, 'minute')
        }
        return rtf.format(0, 'second')
    }

    const isFuture = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return false
        }
        const d = new Date(date)
        return d.getTime() > Date.now()
    }

    return {
        formatDate,
        formatDateTime,
        relativeTime,
        isFuture,
        d: formatDateTime, // Alias for template usage
    }
}
