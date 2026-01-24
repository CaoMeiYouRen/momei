import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItContainer from 'markdown-it-container'
import { full as MarkdownItEmoji } from 'markdown-it-emoji'
import githubAlerts from 'markdown-it-github-alerts'
import texmath from 'markdown-it-texmath'
import katex from 'katex'
import hljs from 'highlight.js'

/**
 * 格式化 Markdown 内容 (中文编写规范)
 * @param content 原始 Markdown 内容
 * @returns 格式化后的内容
 */
export async function formatMarkdown(content: string) {
    if (!content) {
        return ''
    }
    // zhlint 仅支持在浏览器环境或 Node.js 环境中运行，但在某些环境下（如 SSR）可能会因为访问 document 而崩溃
    // 且 zhlint 主要是给前端编辑器使用的，所以在此处增加环境判断或动态导入
    try {
        if (import.meta.server) {
            return content // SSR 环境下跳过格式化
        }

        const { run } = await import('zhlint/dist/zhlint.es')
        const output = run(content, {
            rules: {
                preset: 'default', // 使用默认预设
                // 禁用标点符号处理是为了避免转换关键字导致的问题
                // 例如 > [! IMPORTANT] 会被转换为 >【！IMPORTANT】
                // 1. 禁用所有标点转换
                halfwidthPunctuation: '', // 禁用：将全角标点转换为半角（如 （） -> ()）
                fullwidthPunctuation: '', // 禁用：将半角标点转换为全角（如 , -> ，）
                unifiedPunctuation: {
                    default: false, // 禁用：标点符号归一化（如繁体标点转换为简体）
                },
                // 2. 禁用所有标点相关的空格规则 (设为 undefined 表示跳过处理)
                noSpaceBeforePauseOrStop: undefined, // 禁用：标点符号（如 ，。：；？！）前不保留空格
                spaceAfterHalfwidthPauseOrStop: undefined, // 禁用：半角标点符号后保留一个空格
                noSpaceAfterFullwidthPauseOrStop: undefined, // 禁用：全角标点符号后不保留空格
                spaceOutsideHalfwidthQuotation: undefined, // 禁用：半角引号（"）外侧保留一个空格
                noSpaceOutsideFullwidthQuotation: undefined, // 禁用：全角引号（“”）外侧不保留空格
                noSpaceInsideQuotation: undefined, // 禁用：引号内侧不保留空格
                spaceOutsideHalfwidthBracket: undefined, // 禁用：半角括号（()）外侧保留一个空格
                noSpaceOutsideFullwidthBracket: undefined, // 禁用：全角括号（（））外侧不保留空格
                noSpaceInsideBracket: undefined, // 禁用：括号内侧不保留空格
            },
        })
        return output.result || content
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

    md.renderer.rules.fence = function (tokens, idx, options, _env, _self) {
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
