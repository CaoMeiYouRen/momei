import sanitizeHtml from 'sanitize-html'
import { createMarkdownRenderer } from './markdown'

const previewMarkdownRenderer = createMarkdownRenderer({
    html: true,
    withAnchor: true,
})

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

export function renderDistributionPreviewHtml(value: string | null | undefined, emptyLabel: string) {
    const normalizedValue = value?.trim()
    if (!normalizedValue) {
        return `<p>${emptyLabel}</p>`
    }

    return sanitizeHtml(previewMarkdownRenderer.render(normalizedValue), previewSanitizeOptions)
}
