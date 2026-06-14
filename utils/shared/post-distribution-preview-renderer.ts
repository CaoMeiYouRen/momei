import sanitizeHtml from 'sanitize-html'
import { createMarkdownRenderer } from './markdown'

const previewMarkdownRenderer = createMarkdownRenderer({
    html: true,
    withAnchor: true,
})
const wechatMpPreviewMarkdownRenderer = createMarkdownRenderer({
    html: true,
    withAnchor: false,
})
const WECHAT_MP_FONT_FAMILY = '-apple-system-font,BlinkMacSystemFont,Helvetica Neue,PingFang SC,Hiragino Sans GB,Microsoft YaHei UI,Microsoft YaHei,Arial,sans-serif'

const previewSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
        'a',
        'div',
        'p',
        'br',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'img',
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'class'],
        img: ['src', 'alt', 'title', 'loading', 'decoding'],
        code: ['class'],
        pre: ['class', 'data-title'],
        div: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        a: sanitizeHtml.simpleTransform('a', {
            target: '_blank',
            rel: 'noopener noreferrer',
        }, true),
    },
}

const wechatMpPreviewSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
        'a',
        'div',
        'section',
        'span',
        'sup',
        'p',
        'br',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'img',
        'figure',
        'figcaption',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'style'],
        span: ['style'],
        sup: ['style'],
        p: ['style'],
        ul: ['style'],
        ol: ['style'],
        li: ['style'],
        blockquote: ['style'],
        code: ['style'],
        pre: ['style'],
        h1: ['style'],
        h2: ['style'],
        h3: ['style'],
        h4: ['style'],
        h5: ['style'],
        h6: ['style'],
        hr: ['style'],
        img: ['src', 'alt', 'title', 'loading', 'decoding', 'referrerpolicy', 'style'],
        figure: ['style'],
        figcaption: ['style'],
        table: ['style'],
        thead: ['style'],
        tbody: ['style'],
        tr: ['style'],
        th: ['style'],
        td: ['style'],
        section: ['style'],
        div: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        a: (_tagName, attribs) => ({
            tagName: 'a',
            attribs: {
                href: attribs.href || '',
                target: '_blank',
                rel: 'noopener noreferrer',
                style: 'text-align:left;line-height:1.75;color:#576b95;text-decoration:none',
            },
        }),
        p: sanitizeHtml.simpleTransform('p', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.5em 8px;letter-spacing:0.1em;color:#3f3f3f`,
        }),
        h1: sanitizeHtml.simpleTransform('h1', {
            style: `text-align:center;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:18px;font-weight:bold;display:table;margin:4em auto 2em;padding:0 0.2em;background:rgba(15, 76, 129, 1);color:#fff`,
        }),
        h2: sanitizeHtml.simpleTransform('h2', {
            style: `text-align:center;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:15.4px;font-weight:bold;display:table;margin:4em auto 2em;padding:0 0.2em;background:rgba(15, 76, 129, 1);color:#fff`,
        }),
        h3: sanitizeHtml.simpleTransform('h3', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:15px;font-weight:bold;margin:2em 8px 1em;color:#0f4c81`,
        }),
        h4: sanitizeHtml.simpleTransform('h4', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;font-weight:bold;margin:1.5em 8px 0.75em;color:#0f4c81`,
        }),
        h5: sanitizeHtml.simpleTransform('h5', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;font-weight:bold;margin:1.5em 8px 0.75em;color:#0f4c81`,
        }),
        h6: sanitizeHtml.simpleTransform('h6', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;font-weight:bold;margin:1.5em 8px 0.75em;color:#0f4c81`,
        }),
        blockquote: sanitizeHtml.simpleTransform('blockquote', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;font-style:normal;border-left:none;padding:1em;border-radius:8px;color:rgba(0,0,0,0.5);background:#f7f7f7;margin:2em 8px`,
        }),
        ul: sanitizeHtml.simpleTransform('ul', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.2em 8px;padding-left:1.2em;color:#3f3f3f`,
        }),
        ol: sanitizeHtml.simpleTransform('ol', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.2em 8px;padding-left:1.4em;color:#3f3f3f`,
        }),
        li: sanitizeHtml.simpleTransform('li', {
            style: 'margin:0.4em 0',
        }),
        hr: sanitizeHtml.simpleTransform('hr', {
            style: 'text-align:left;line-height:1.75;border-style:solid;border-width:1px 0 0;border-color:rgba(0,0,0,0.1);transform-origin:0 0;transform:scale(1, 0.5)',
        }),
        img: (_tagName, attribs) => ({
            tagName: 'img',
            attribs: {
                src: attribs.src || '',
                alt: attribs.alt || '',
                title: attribs.title || '',
                loading: 'lazy',
                decoding: 'async',
                referrerpolicy: 'same-origin',
                style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;border-radius:4px;display:block;margin:0.1em auto 0.5em;width:100% !important;height:auto`,
            },
        }),
        figure: sanitizeHtml.simpleTransform('figure', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.5em 8px;color:#3f3f3f`,
        }),
        figcaption: sanitizeHtml.simpleTransform('figcaption', {
            style: 'text-align:center;line-height:1.75;color:#888;font-size:0.8em',
        }),
        code: sanitizeHtml.simpleTransform('code', {
            style: 'text-align:left;line-height:1.75;font-size:90%;white-space:pre;color:#d14;background:rgba(27,31,35,.05);padding:3px 5px;border-radius:4px',
        }),
        pre: sanitizeHtml.simpleTransform('pre', {
            style: `text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.5em 8px;padding:0.75em;border:1px solid #dfdfdf;border-radius:4px;background:rgba(27,31,35,.03);overflow:auto`,
        }),
        section: sanitizeHtml.simpleTransform('section', {
            style: 'padding:0 8px',
        }),
        table: sanitizeHtml.simpleTransform('table', {
            style: `width:100%;border-collapse:collapse;text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;margin:1.5em 8px;color:#3f3f3f`,
        }),
        thead: sanitizeHtml.simpleTransform('thead', {
            style: 'background:rgba(0, 0, 0, 0.05);font-weight:bold;color:#3f3f3f',
        }),
        th: sanitizeHtml.simpleTransform('th', {
            style: 'border:1px solid #dfdfdf;padding:0.25em 0.5em;color:#3f3f3f',
        }),
        td: sanitizeHtml.simpleTransform('td', {
            style: 'border:1px solid #dfdfdf;padding:0.25em 0.5em;color:#3f3f3f',
        }),
        tr: sanitizeHtml.simpleTransform('tr', {}),
        div: sanitizeHtml.simpleTransform('div', {}),
    },
}

interface DistributionPreviewRenderOptions {
    contentProfile?: 'default' | 'weibo' | 'xiaohongshu' | 'wechat_mp'
}

function stripHtml(value: string) {
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim()
}

function normalizeWechatMpReferenceItem(itemHtml: string, index: number) {
    const codeMatch = /<code\b[^>]*>([\s\S]*?)<\/code>/iu.exec(itemHtml)
    const url = stripHtml(codeMatch?.[1] || '')
    const labelRaw = codeMatch
        ? itemHtml.replace(codeMatch[0], '')
        : itemHtml
    const label = stripHtml(labelRaw).replace(/:\s*$/u, '').trim() || '链接'
    const suffix = url ? `: <i>${url}</i>` : ''
    return `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code> ${label}${suffix}<br>`
}

function renderWechatMpReferencesAsTemplateStyle(renderedHtml: string) {
    return renderedHtml.replace(
        /<h[1-6][^>]*>(引用链接|外链引用)<\/h[1-6]>\s*<ol[^>]*>([\s\S]*?)<\/ol>/giu,
        (_match, title, listHtml) => {
            const listItems = Array.from((String(listHtml)).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/giu))
            const lines = listItems.map((entry, index) => normalizeWechatMpReferenceItem(entry[1] || '', index + 1)).join('')

            return `<h4 style="text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:14px;font-weight:bold;margin:2em 8px 0.5em;color:rgba(15, 76, 129, 1)">${title}</h4><p style="text-align:left;line-height:1.75;font-family:${WECHAT_MP_FONT_FAMILY};font-size:80%;margin:0.5em 8px;color:#3f3f3f">${lines}</p>`
        },
    )
}

function styleWechatMpInlineReferenceMarkers(renderedHtml: string) {
    return renderedHtml.replace(/>([^<]+)</gu, (_match, rawText) => {
        const styledText = String(rawText).replace(/([^\s[][^[]*?)\[(\d+)\]/gu, (_token, label, rawIndex) => {
            const normalizedLabel = String(label || '').trimEnd()
            if (!normalizedLabel) {
                return _token
            }

            const shouldSplitByColon = !normalizedLabel.includes('://')
            const colonIndex = shouldSplitByColon
                ? Math.max(
                    normalizedLabel.lastIndexOf(':'),
                    normalizedLabel.lastIndexOf('：'),
                )
                : -1
            const prefix = colonIndex >= 0 ? `${normalizedLabel.slice(0, colonIndex + 1)} ` : ''
            const markerLabel = colonIndex >= 0
                ? normalizedLabel.slice(colonIndex + 1).trim()
                : normalizedLabel
            if (!markerLabel) {
                return _token
            }

            return `${prefix}<span style="text-align:left;line-height:1.75;color:#576b95">${markerLabel}<sup style="font-size:90%;opacity:0.8;margin-left:1px">[${rawIndex}]</sup></span>`
        })
        return `>${styledText}<`
    })
}

export function renderDistributionPreviewHtml(
    value: string | null | undefined,
    emptyLabel: string,
    options?: DistributionPreviewRenderOptions,
) {
    const normalizedValue = value?.trim()
    if (!normalizedValue) {
        return `<p>${emptyLabel}</p>`
    }

    if (options?.contentProfile === 'wechat_mp') {
        const renderedHtml = sanitizeHtml(
            wechatMpPreviewMarkdownRenderer.render(normalizedValue),
            wechatMpPreviewSanitizeOptions,
        )
        const styledHtml = styleWechatMpInlineReferenceMarkers(
            renderWechatMpReferencesAsTemplateStyle(renderedHtml),
        )
        return `<div style="width:750px;max-width:100%;margin:auto">${styledHtml}</div>`
    }

    return sanitizeHtml(previewMarkdownRenderer.render(normalizedValue), previewSanitizeOptions)
}
