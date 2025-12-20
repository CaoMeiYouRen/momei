import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式，默认为 'YYYY-MM-DD'
 * @param locale 语言，默认为 'zh-cn'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date | number, format: string = 'YYYY-MM-DD', locale: string = 'zh-cn') => {
    if (!date) {
        return ''
    }
    return dayjs(date).locale(locale).format(format)
}

/**
 * 格式化日期时间
 * @param date 日期
 * @param format 格式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @param locale 语言，默认为 'zh-cn'
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date | number, format: string = 'YYYY-MM-DD HH:mm:ss', locale: string = 'zh-cn') => {
    if (!date) {
        return ''
    }
    return dayjs(date).locale(locale).format(format)
}
