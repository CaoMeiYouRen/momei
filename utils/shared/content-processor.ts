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

function splitOversizedSegment(segment: string, chunkSize: number, minChunkSize: number) {
    if (segment.length <= chunkSize) {
        return [segment]
    }

    const pieces: string[] = []
    let remaining = segment

    while (remaining.length > chunkSize) {
        const candidate = remaining.slice(0, chunkSize + 1)
        const preferredSplitIndex = Math.max(
            candidate.lastIndexOf('\n'),
            candidate.lastIndexOf('。'),
            candidate.lastIndexOf('！'),
            candidate.lastIndexOf('？'),
            candidate.lastIndexOf('.'),
            candidate.lastIndexOf('!'),
            candidate.lastIndexOf('?'),
            candidate.lastIndexOf('；'),
            candidate.lastIndexOf(';'),
            candidate.lastIndexOf('，'),
            candidate.lastIndexOf(','),
            candidate.lastIndexOf('、'),
            candidate.lastIndexOf(' '),
        )

        const splitIndex = preferredSplitIndex >= minChunkSize
            ? preferredSplitIndex + 1
            : chunkSize

        pieces.push(remaining.slice(0, splitIndex))
        remaining = remaining.slice(splitIndex)
    }

    if (remaining) {
        pieces.push(remaining)
    }

    return pieces
}

export function preserveMarkdownChunkBoundary(sourceChunk: string, translatedChunk: string) {
    const trailingBoundary = (/(\n\n|\n)$/.exec(sourceChunk))?.[0] || ''
    const leadingBoundary = (/^(\n\n|\n)/.exec(sourceChunk))?.[0] || ''
    let normalizedChunk = translatedChunk

    if (leadingBoundary) {
        normalizedChunk = normalizedChunk.replace(/^(\n\n|\n)/, '')
        normalizedChunk = `${leadingBoundary}${normalizedChunk}`
    }

    if (trailingBoundary) {
        normalizedChunk = normalizedChunk.replace(/(\n\n|\n)$/, '')
        normalizedChunk = `${normalizedChunk}${trailingBoundary}`
    }

    return normalizedChunk
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
                const segmentPattern = /.*?[。！？.?!\n]+|.+/g
                const subSegments: string[] = []
                let segmentMatch = segmentPattern.exec(processedSegment)

                while (segmentMatch) {
                    subSegments.push(segmentMatch[0])
                    segmentMatch = segmentPattern.exec(processedSegment)
                }

                if (subSegments.length === 0) {
                    subSegments.push(processedSegment)
                }
                for (const sub of subSegments) {
                    const boundedSubSegments = splitOversizedSegment(sub, chunkSize, minChunkSize)

                    for (const boundedSubSegment of boundedSubSegments) {
                        if (currentChunk.length + boundedSubSegment.length > chunkSize && currentChunk.length >= minChunkSize) {
                            const trimmed = currentChunk.trim()
                            if (trimmed) {
                                chunks.push(trimmed)
                            }
                            currentChunk = ''
                        }

                        currentChunk += boundedSubSegment
                    }
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

    /**
     * 将 Markdown 内容拆分为多个块，同时保证 chunks 直接拼接后可恢复原始内容。
     */
    static splitMarkdownLossless(
        content: string,
        options: SplitOptions = {},
    ): string[] {
        const { chunkSize = 4000, minChunkSize = 200 } = options

        if (!content?.trim()) {
            return []
        }

        const chunks: string[] = []
        let currentChunk = ''
        const rawSegments = content.split(/(\n\n|\n(?=#+ ))/g)

        for (const segment of rawSegments) {
            if (!segment) {
                continue
            }

            if (currentChunk.length + segment.length > chunkSize) {
                if (currentChunk.length >= minChunkSize) {
                    chunks.push(currentChunk)
                    currentChunk = ''
                }
            }

            if (segment.length > chunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk)
                    currentChunk = ''
                }

                const boundedSegments = splitOversizedSegment(segment, chunkSize, minChunkSize)
                for (const boundedSegment of boundedSegments) {
                    if (currentChunk.length + boundedSegment.length > chunkSize && currentChunk.length >= minChunkSize) {
                        chunks.push(currentChunk)
                        currentChunk = ''
                    }

                    currentChunk += boundedSegment
                }

                continue
            }

            currentChunk += segment
        }

        if (currentChunk) {
            chunks.push(currentChunk)
        }

        return chunks
    }
}
