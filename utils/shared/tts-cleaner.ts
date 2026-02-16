/**
 * 文本净化工具，用于将 Markdown 内容转换为更适合 TTS 朗读的纯文本
 */
export function cleanTextForTTS(text: string): string {
    if (!text) {
        return ''
    }

    let cleaned = text
        // 1. 移除 Markdown 图片: ![alt](url) -> ""
        .replace(/!\[.*?\]\(.*?\)/g, '')
        // 2. 转换 Markdown 链接: [text](url) -> text
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        // 3. 移除独立的 URL (http/https/ftp)
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
        // 4. 移除代码块 (包括内容)
        .replace(/```[\s\S]*?```/g, '')
        // 5. 移除行内代码: `code` -> code
        .replace(/`(.*?)`/g, '$1')
        // 6. 移除 HTML 标签
        .replace(/<[^>]*>?/g, '')
        // 7. 移除常用的 Markdown 符号，但保留标点
        .replace(/^[#\->+*]+ /gm, '') // 标题和列表符号
        .replace(/[*_~]/g, '') // 加粗、斜体、删除线

    // 8. 规范化空白字符
    cleaned = cleaned
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n')

    return cleaned.trim()
}
