import sanitizeHtml from 'sanitize-html'
import { convert, type HtmlToTextOptions } from 'html-to-text'

const defaultTextConvertOptions: HtmlToTextOptions = {
    wordwrap: false,
    selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
}

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

    return sanitizeHtml(input, plainTextSanitizeOptions).trim()
}

/**
 * 将 HTML 转换为纯文本（用于邮件摘要等场景）。
 */
export function htmlToPlainText(html: string): string {
    if (!html) {
        return ''
    }

    return convert(html, defaultTextConvertOptions).trim()
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
