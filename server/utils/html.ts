import { convert, type HtmlToTextOptions } from 'html-to-text'
import { plainTextToHtml, sanitizeHtmlToText } from '@/utils/shared/html'

const defaultTextConvertOptions: HtmlToTextOptions = {
    wordwrap: false,
    selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
}

export { plainTextToHtml, sanitizeHtmlToText }

/**
 * 将 HTML 转换为纯文本（用于邮件摘要等场景）。
 */
export function htmlToPlainText(html: string): string {
    if (!html) {
        return ''
    }

    return convert(html, defaultTextConvertOptions).trim()
}

