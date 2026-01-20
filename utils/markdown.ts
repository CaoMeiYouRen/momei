import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItContainer from 'markdown-it-container'
import { full as MarkdownItEmoji } from 'markdown-it-emoji'
import githubAlerts from 'markdown-it-github-alerts'
import hljs from 'highlight.js'
import { lintMarkdown } from '@lint-md/core'

/**
 * 格式化 Markdown 内容 (中文编写规范)
 * @param content 原始 Markdown 内容
 * @returns 格式化后的内容
 */
export function formatMarkdown(content: string) {
    if (!content) {
        return ''
    }
    try {
        const { fixedResult } = lintMarkdown(content, {}, true)
        return fixedResult?.result || content
    } catch (error) {
        console.error('Markdown formatting failed:', error)
        return content
    }
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
    })

    // 为图片添加懒加载属性
    const defaultImageRender = md.renderer.rules.image || function (tokens: any, idx: number, options: any, env: any, self: any) {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        if (token) {
            token.attrPush(['loading', 'lazy'])
            token.attrPush(['decoding', 'async'])
        }
        return defaultImageRender(tokens, idx, options, env, self)
    }

    // 自定义代码块渲染逻辑，支持 [title]
    const _defaultFenceRender = md.renderer.rules.fence || function (tokens: any, idx: number, options: any, _env: any, self: any) {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        if (!token) {
            return ''
        }

        const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
        const titleMatch = info.match(/\[(.*?)\]/)
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
        if (highlighted.indexOf('<pre') === 0) {
            return `${highlighted}\n`
        }

        const titleAttr = title ? ` data-title="${md.utils.escapeHtml(title)}"` : ''
        return `<pre class="hljs"${titleAttr}><div class="copy-code-wrapper"><button class="copy-code-button" title="Copy Code"></button></div><code class="language-${md.utils.escapeHtml(langName)}">${highlighted}</code></pre>\n`
    }

    if (mdOptions.withAnchor) {
        md.use(MarkdownItAnchor, {
            slugify: (s: string) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
            permalink: MarkdownItAnchor.permalink.headerLink(),
        })
    }

    // 集成表情符号
    md.use(MarkdownItEmoji)

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
