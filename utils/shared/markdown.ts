import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItContainer from 'markdown-it-container'
import { light as MarkdownItEmoji } from 'markdown-it-emoji'
import githubAlerts from 'markdown-it-github-alerts'
import sanitizeHtml from 'sanitize-html'
import texmath from 'markdown-it-texmath'
import katex from 'katex'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import scss from 'highlight.js/lib/languages/scss'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { slugifyMarkdownHeading } from './markdown-heading'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('text', plaintext)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

export interface MarkdownRendererInstance extends MarkdownIt {
    __image?: Record<string, string | undefined>
    image_add: (key: string | number, url: string) => void
    image_del: (key: unknown) => void
}

export interface MarkdownOptions {
    /**
     * 是否允许 HTML 标签
     * @default false
     */
    html?: boolean
    /**
     * 是否自动转换链接
     * @default true
     */
    linkify?: boolean
    /**
     * 是否启用典型符号替换
     * @default true
     */
    typographer?: boolean
    /**
     * 是否启用锚点插件 (markdown-it-anchor)
     * @default false
     */
    withAnchor?: boolean
}

const defaultAllowedTags = Array.isArray(sanitizeHtml.defaults.allowedTags)
    ? sanitizeHtml.defaults.allowedTags
    : []

const defaultAllowedAttributes = sanitizeHtml.defaults.allowedAttributes || {}

function mergeAllowedAttributes(tag: string, attributes: string[]) {
    const baseAttributes = Array.isArray(defaultAllowedAttributes[tag])
        ? defaultAllowedAttributes[tag]
        : []

    return Array.from(new Set([...baseAttributes, ...attributes]))
}

const markdownSanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: Array.from(new Set([
        ...defaultAllowedTags,
        'abbr',
        'dd',
        'dl',
        'dt',
        'img',
        'input',
        'ins',
        'mark',
        'button',
        'math',
        'semantics',
        'annotation',
        'annotation-xml',
        'mrow',
        'mi',
        'mo',
        'mn',
        'msup',
        'mfrac',
        'msqrt',
        'mtext',
        'sub',
        'sup',
    ])),
    allowedAttributes: {
        ...defaultAllowedAttributes,
        a: mergeAllowedAttributes('a', ['class', 'id', 'rel']),
        abbr: mergeAllowedAttributes('abbr', ['title']),
        img: mergeAllowedAttributes('img', ['loading', 'decoding']),
        code: mergeAllowedAttributes('code', ['class']),
        pre: mergeAllowedAttributes('pre', ['class', 'data-title']),
        div: mergeAllowedAttributes('div', ['class']),
        dl: mergeAllowedAttributes('dl', ['class']),
        dt: mergeAllowedAttributes('dt', ['class']),
        dd: mergeAllowedAttributes('dd', ['class']),
        input: mergeAllowedAttributes('input', ['checked', 'class', 'disabled', 'type']),
        ins: mergeAllowedAttributes('ins', ['class']),
        li: mergeAllowedAttributes('li', ['class']),
        mark: mergeAllowedAttributes('mark', ['class']),
        ol: mergeAllowedAttributes('ol', ['class']),
        p: mergeAllowedAttributes('p', ['class']),
        section: mergeAllowedAttributes('section', ['class', 'data-footnotes']),
        span: mergeAllowedAttributes('span', ['class', 'aria-hidden']),
        sub: mergeAllowedAttributes('sub', ['class']),
        sup: mergeAllowedAttributes('sup', ['class']),
        button: mergeAllowedAttributes('button', ['type', 'class', 'title', 'aria-label']),
        math: mergeAllowedAttributes('math', ['xmlns', 'display']),
        annotation: mergeAllowedAttributes('annotation', ['encoding']),
        'annotation-xml': mergeAllowedAttributes('annotation-xml', ['encoding']),
        h1: mergeAllowedAttributes('h1', ['id', 'tabindex']),
        h2: mergeAllowedAttributes('h2', ['id', 'tabindex']),
        h3: mergeAllowedAttributes('h3', ['id', 'tabindex']),
        h4: mergeAllowedAttributes('h4', ['id', 'tabindex']),
        h5: mergeAllowedAttributes('h5', ['id', 'tabindex']),
        h6: mergeAllowedAttributes('h6', ['id', 'tabindex']),
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        img: ['http', 'https', 'data'],
    },
}

function attachMarkdownImagePlaceholderSupport(md: MarkdownRendererInstance) {
    const imageMap = md.__image && typeof md.__image === 'object' ? md.__image : {}

    md.__image = imageMap
    md.image_add = (key, url) => {
        imageMap[String(key)] = url
    }
    md.image_del = (key) => {
        imageMap[String(key)] = undefined
    }
}

/**
 * 创建并配置 Markdown 渲染器实例
 * @param mdOptions 渲染配置
 * @returns MarkdownIt 实例
 */
export function createMarkdownRenderer(mdOptions: MarkdownOptions = {}) {
    const md = new MarkdownIt({
        html: mdOptions.html ?? false,
        linkify: mdOptions.linkify ?? true,
        typographer: mdOptions.typographer ?? true,
        highlight: (str, lang) => {
            const pureLang = lang ? lang.replace(/\[.*?\]/, '').trim() : ''

            if (pureLang && hljs.getLanguage(pureLang)) {
                try {
                    return hljs.highlight(str, { language: pureLang }).value
                } catch {
                    // ignore error
                }
            }
            return '' // use external default escaping
        },
    }) as MarkdownRendererInstance

    attachMarkdownImagePlaceholderSupport(md)

    // 为图片添加懒加载属性
    const defaultImageRender = md.renderer.rules.image || function (tokens: any, idx: number, options: any, env: any, self: any) {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        if (token) {
            const srcIndex = token.attrIndex('src')
            if (srcIndex >= 0) {
                const rawSrc = token.attrs?.[srcIndex]?.[1]
                const resolvedSrc = rawSrc ? md.__image?.[rawSrc] : undefined

                if (rawSrc && resolvedSrc) {
                    token.attrSet('rel', rawSrc)
                    const sourceAttribute = token.attrs?.[srcIndex]
                    if (sourceAttribute) {
                        sourceAttribute[1] = resolvedSrc
                    }
                }
            }

            token.attrSet('loading', 'lazy')
            token.attrSet('decoding', 'async')
        }
        return defaultImageRender(tokens, idx, options, env, self)
    }

    md.renderer.rules.fence = function (tokens, idx, options) {
        const token = tokens[idx]
        if (!token) {
            return ''
        }

        const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
        const titleMatch = /\[(.*?)\]/.exec(info)
        const title = titleMatch ? titleMatch[1] : ''

        // 如果 highlight 返回了内容，我们手动包裹它
        const langName = info.replace(/\[.*?\]/, '').trim().split(/\s+/g)[0] || ''
        let highlighted = ''
        if (options.highlight) {
            highlighted = options.highlight(token.content, langName, '') || md.utils.escapeHtml(token.content)
        } else {
            highlighted = md.utils.escapeHtml(token.content)
        }

        // 如果 highlight 返回的结果已经包含了 <pre，则直接使用
        if (highlighted.startsWith('<pre')) {
            return `${highlighted}\n`
        }

        const titleAttr = title ? ` data-title="${md.utils.escapeHtml(title)}"` : ''
        return `<pre class="hljs"${titleAttr}><div class="copy-code-wrapper"><button class="copy-code-button" title="Copy Code"></button></div><code class="language-${md.utils.escapeHtml(langName)}">${highlighted}</code></pre>\n`
    }

    if (mdOptions.withAnchor) {
        md.use(MarkdownItAnchor, {
            slugify: slugifyMarkdownHeading,
            permalink: MarkdownItAnchor.permalink.headerLink(),
        })
    }

    // 集成表情符号
    md.use(MarkdownItEmoji)

    // 集成数学公式
    md.use(texmath, {
        engine: katex,
        delimiters: 'dollars',
        katexOptions: { macros: { '\\RR': '\\mathbb{R}' } },
    })

    // 集成 GitHub 警报语法
    md.use(githubAlerts)

    // 集成自定义容器 (tip, warning, danger, info)
    const containers = ['tip', 'warning', 'danger', 'info']
    containers.forEach((type) => {
        md.use(MarkdownItContainer as any, type, {
            render: (tokens: any, idx: number) => {
                const token = tokens[idx]
                const info = token.info.trim().slice(type.length).trim()
                if (token.nesting === 1) {
                    const title = info || type.toUpperCase()
                    return `<div class="${type} custom-block"><p class="custom-block-title">${title}</p>\n`
                }
                return '</div>\n'

            },
        })
    })

    // 集成代码组 (Code Group)
    md.use(MarkdownItContainer as any, 'code-group', {
        render: (tokens: any, idx: number) => {
            if (tokens[idx].nesting === 1) {
                return '<div class="code-group">\n'
            }
            return '</div>\n'

        },
    })

    return md
}

export function sanitizeRenderedMarkdownHtml(value: string) {
    if (!value) {
        return ''
    }

    return sanitizeHtml(value, markdownSanitizeOptions)
}
