/**
 * 计算字数
 * 中文字符计为 1 个字，英文单词计为 1 个字
 * @param content 文章内容 (Markdown)
 */
export function countWords(content: string): number {
    if (!content) {
        return 0
    }
    // 移除 Markdown 语法 (简单处理)
    const cleanContent = content
        .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
        .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
        .replace(/`{3}[\s\S]*?`{3}/g, '') // 移除代码块
        .replace(/`.*?`/g, '') // 移除行内代码
        .replace(/[#*_\-~>|]/g, ' ') // 移除 Markdown 特殊符号

    // 统计中文汉字
    const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
    // 统计英文单词 (排除标点符号)
    const englishWords = cleanContent
        .replace(/[\u4e00-\u9fa5]/g, ' ') // 将中文替换为空格
        .replace(/[^\w\s]/g, ' ') // 将所有非字母数字和非空白字符替换为空格
        .split(/\s+/)
        .filter((word) => word.length > 0).length

    return chineseChars + englishWords
}

/**
 * 估算阅读时间 (分钟)
 * 假设中文阅读速度为 400 字/分钟，英文为 200 词/分钟
 * @param content 文章内容
 */
export function estimateReadingTime(content: string): number {
    if (!content) {
        return 0
    }

    // 这里的简化处理直接使用总字数 / 平均速度
    const totalWords = countWords(content)
    const wordsPerMinute = 300 // 综合平均速度

    const minutes = Math.ceil(totalWords / wordsPerMinute)
    return minutes > 0 ? minutes : 1
}
