import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate as _formatDate, formatDateTime as _formatDateTime } from '@/utils/shared/date'

/**
 * 将 i18n 的 locale 转换为日期库（如 dayjs）识别的 locale
 */
const dateLocaleMap: Record<string, string> = {
    'zh-CN': 'zh-cn',
    'en-US': 'en',
}

export function useI18nDate() {
    const { locale } = useI18n()

    const currentLocale = computed(() => dateLocaleMap[locale.value] || locale.value.toLowerCase())
    const currentIntlLocale = computed(() => locale.value)

    const formatDate = (date: string | number | Date | null | undefined, format?: string) => {
        if (!date) {
            return '-'
        }
        return _formatDate(date, format, currentLocale.value)
    }

    const formatDateTime = (date: string | number | Date | null | undefined, format?: string) => {
        if (!date) {
            return '-'
        }
        return _formatDateTime(date, format, currentLocale.value)
    }

    const relativeTime = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return '-'
        }
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        // 使用转换后的 Intl locale
        const rtf = new Intl.RelativeTimeFormat(currentIntlLocale.value, { numeric: 'auto' })

        if (days > 30) {
            return formatDate(date)
        }
        if (days > 0) {
            return rtf.format(-days, 'day')
        }
        if (hours > 0) {
            return rtf.format(-hours, 'hour')
        }
        if (minutes > 0) {
            return rtf.format(-minutes, 'minute')
        }
        return rtf.format(0, 'second')
    }

    return {
        formatDate,
        formatDateTime,
        relativeTime,
        d: formatDateTime, // Alias for template usage
    }
}
