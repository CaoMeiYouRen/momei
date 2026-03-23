/**
 * 格式化 Markdown 内容（中文编写规范）
 *
 * 该模块独立于 Markdown 渲染器，避免编辑器仅调用格式化功能时
 * 仍把 markdown-it、KaTeX、highlight.js 等重依赖打进同一个异步块。
 */
export async function formatMarkdown(content: string) {
    if (!content) {
        return ''
    }

    try {
        if (import.meta.server) {
            return content
        }

        const { run } = await import('zhlint/dist/zhlint.es')
        const output = run(content, {
            rules: {
                preset: 'default',
                halfwidthPunctuation: '',
                fullwidthPunctuation: '',
                unifiedPunctuation: {
                    default: false,
                },
                noSpaceBeforePauseOrStop: undefined,
                spaceAfterHalfwidthPauseOrStop: undefined,
                noSpaceAfterFullwidthPauseOrStop: undefined,
                spaceOutsideHalfwidthQuotation: undefined,
                noSpaceOutsideFullwidthQuotation: undefined,
                noSpaceInsideQuotation: undefined,
                spaceOutsideHalfwidthBracket: undefined,
                noSpaceOutsideFullwidthBracket: undefined,
                noSpaceInsideBracket: undefined,
            },
        })

        return output.result || content
    } catch (error) {
        console.error('Markdown formatting failed:', error)
        return content
    }
}
