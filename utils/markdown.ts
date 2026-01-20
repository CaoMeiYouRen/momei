import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import hljs from 'highlight.js'

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
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, { language: lang }).value
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

    if (mdOptions.withAnchor) {
        md.use(MarkdownItAnchor, {
            slugify: (s: string) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
            permalink: MarkdownItAnchor.permalink.headerLink(),
        })
    }

    return md
}
