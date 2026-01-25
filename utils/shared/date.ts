import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式，默认为 'YYYY-MM-DD'
 * @param locale 语言，默认为 'zh-cn'
 * @param tz 时区
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date | number, format: string = 'YYYY-MM-DD', locale: string = 'zh-cn', tz?: string) => {
    if (!date) {
        return ''
    }
    let d = dayjs(date).locale(locale)
    if (tz) {
        d = d.tz(tz)
    }
    return d.format(format)
}

/**
 * 格式化日期时间
 * @param date 日期
 * @param format 格式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @param locale 语言，默认为 'zh-cn'
 * @param tz 时区
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date | number, format: string = 'YYYY-MM-DD HH:mm:ss', locale: string = 'zh-cn', tz?: string) => {
    if (!date) {
        return ''
    }
    let d = dayjs(date).locale(locale)
    if (tz) {
        d = d.tz(tz)
    }
    return d.format(format)
}

/**
 * 将秒数转换为 HH:mm:ss 格式
 * @param seconds 秒数
 * @returns HH:mm:ss 格式的字符串
 */
export const secondsToDuration = (seconds?: number | null) => {
    if (!seconds || isNaN(Number(seconds))) {
        return '00:00:00'
    }
    const dur = dayjs.duration(Number(seconds), 'seconds')
    const hours = Math.floor(dur.asHours())
    const mins = dur.minutes()
    const secs = dur.seconds()
    return [
        hours.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
    ].join(':')
}

/**
 * 将 HH:mm:ss 格式转换为秒数
 * @param durationStr HH:mm:ss 格式的字符串
 * @returns 秒数
 */
export const durationToSeconds = (durationStr?: string | null) => {
    if (!durationStr) {
        return 0
    }
    const parts = durationStr.split(':').map(Number)
    let totalSeconds = 0
    if (parts.length === 3) {
        // HH:mm:ss
        totalSeconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
    } else if (parts.length === 2) {
        // mm:ss
        totalSeconds = (parts[0] || 0) * 60 + (parts[1] || 0)
    } else if (parts.length === 1) {
        // ss
        totalSeconds = (parts[0] || 0)
    }
    return isNaN(totalSeconds) ? 0 : totalSeconds
}
