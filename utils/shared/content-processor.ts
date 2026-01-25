/**
 * AI 内容处理工具
 * 用于处理长文章的拆分、分段处理等逻辑
 */

export interface SplitOptions {
    /** 目标块大小（字符数） */
    chunkSize?: number
    /** 最小块大小，避免产生过小的碎片 */
    minChunkSize?: number
}

export class ContentProcessor {
    /**
     * 将 Markdown 内容拆分为多个块
     * 优先在标题处拆分，其次在段落处拆分
     */
    static splitMarkdown(
        content: string,
        options: SplitOptions = {},
    ): string[] {
        const { chunkSize = 4000, minChunkSize = 200 } = options

        if (content.length <= chunkSize) {
            return [content]
        }

        const chunks: string[] = []
        let currentChunk = ''

        // 识别 Markdown 标题和段落
        const segments = content.split(/(\n(?=#+ )|\n\n)/g)

        for (const segment of segments) {
            // 过滤掉纯空白字符
            if (!segment.trim() && segment !== '\n\n') {
                continue
            }

            if (
                currentChunk.length + segment.length > chunkSize
                && currentChunk.length >= minChunkSize
            ) {
                const trimmed = currentChunk.trim()
                if (trimmed) {
                    chunks.push(trimmed)
                }
                currentChunk = ''
            }

            // 如果单个段落就超过了 chunkSize，则进一步细分
            if (segment.length > chunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim())
                    currentChunk = ''
                }

                // 按行或句子切分长段落
                const subSegments = segment.match(
                    /[^\n。！？.?!]+[。！？.?!\n]*/g,
                ) || [segment]
                for (const sub of subSegments) {
                    if (
                        currentChunk.length + sub.length > chunkSize
                        && currentChunk.length >= minChunkSize
                    ) {
                        const trimmed = currentChunk.trim()
                        if (trimmed) {
                            chunks.push(trimmed)
                        }
                        currentChunk = ''
                    }
                    currentChunk += sub
                }
                continue
            }

            currentChunk += segment
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim())
        }

        return chunks
    }
}
