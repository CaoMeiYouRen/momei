import { useI18n } from 'vue-i18n'
import { formatDate as _formatDate, formatDateTime as _formatDateTime } from '@/utils/shared/date'

export function useI18nDate() {
    const { locale } = useI18n()

    const formatDate = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return '-'
        }
        return _formatDate(date, locale.value)
    }

    const formatDateTime = (date: string | number | Date | null | undefined) => {
        if (!date) {
            return '-'
        }
        return _formatDateTime(date, locale.value)
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

        // Basic relative time, could be improved with Intl.RelativeTimeFormat
        const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

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
