import { compile, type HtmlToTextOptions } from 'html-to-text'
import { plainTextToHtml, sanitizeHtmlToText } from '@/utils/shared/html'

const defaultTextConvertOptions: HtmlToTextOptions = {
    wordwrap: false,
    selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
}

const ignoreHrefTextConvertOptions: HtmlToTextOptions = {
    wordwrap: false,
    selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { ignoreHref: true } },
    ],
}

const defaultHtmlToText = compile(defaultTextConvertOptions)
const ignoreHrefHtmlToText = compile(ignoreHrefTextConvertOptions)

interface HtmlToPlainTextOptions {
    linkHrefMode?: 'hide-if-same' | 'ignore'
    collapseWhitespace?: boolean
}

export { plainTextToHtml, sanitizeHtmlToText }

/**
 * 将 HTML 转换为纯文本（用于邮件摘要等场景）。
 */
export function htmlToPlainText(html: string, options: HtmlToPlainTextOptions = {}): string {
    if (!html) {
        return ''
    }

    const { linkHrefMode = 'hide-if-same', collapseWhitespace = false } = options
    const plainText = (linkHrefMode === 'ignore' ? ignoreHrefHtmlToText : defaultHtmlToText)(html)

    return (collapseWhitespace ? plainText.replace(/\s+/g, ' ') : plainText).trim()
}

