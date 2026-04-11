import { unescape } from 'lodash-es'
import sanitizeHtml from 'sanitize-html'

const plainTextSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
}

/**
 * 清洗 HTML 字符串为安全纯文本。
 */
export function sanitizeHtmlToText(input: string): string {
    if (!input) {
        return ''
    }

    return unescape(sanitizeHtml(input, plainTextSanitizeOptions)).trim()
}

/**
 * 将纯文本安全转换为 HTML（保留换行）。
 */
export function plainTextToHtml(input: string): string {
    if (!input) {
        return ''
    }

    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('\'', '&#39;')
        .replace(/\n/gu, '<br/>')
}
