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

        if (!content?.trim()) {
            return []
        }

        const chunks: string[] = []
        let currentChunk = ''

        // 识别 Markdown 标题和段落，保留分隔符
        const rawSegments = content.split(/(\n\n|\n(?=#+ ))/g)

        for (const segment of rawSegments) {
            if (!segment) {
                continue
            }

            // 处理行尾空格
            const processedSegment = segment.split('\n').map((line) => line.trimEnd()).join('\n')

            // 如果当前块加上新段落超过限制
            if (currentChunk.length + processedSegment.length > chunkSize) {
                // 如果已经达到最小大小，推入当前块
                if (currentChunk.length >= minChunkSize) {
                    const trimmed = currentChunk.trim()
                    if (trimmed) {
                        chunks.push(trimmed)
                    }
                    currentChunk = ''
                }
            }

            // 如果单段极其长，超过限制，则强制切分
            if (processedSegment.length > chunkSize) {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim())
                    currentChunk = ''
                }

                // 切分长段落（按句子或行）
                const subSegments = processedSegment.match(/.*?[。！？.?!\n]+|.+/g) || [processedSegment]
                for (const sub of subSegments) {
                    if (currentChunk.length + sub.length > chunkSize && currentChunk.length >= minChunkSize) {
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

            currentChunk += processedSegment
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim())
        }

        return chunks
    }
}
