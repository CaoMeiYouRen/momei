export interface FaqItem {
    question: string
    answer: string
}

function resolveFenceMarker(line: string): string | null {
    const match = /^(```+|~~~+)/u.exec(line.trim())

    if (!match) {
        return null
    }

    return match[1]!.startsWith('```') ? '```' : '~~~'
}

export function collapseWhitespace(text: string): string {
    return text.replace(/\s+/gu, ' ').trim()
}

export function stripMarkdownToPlainText(markdown: string): string {
    if (!markdown) {
        return ''
    }

    const plainText = markdown
        .replace(/```[\s\S]*?```/gu, ' ')
        .replace(/`[^`]*`/gu, ' ')
        .replace(/!\[([^\]]*)\]\([^)]*\)/gu, ' $1 ')
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, ' $1 ')
        .replace(/^#{1,6}\s+/gmu, '')
        .replace(/^>+\s?/gmu, '')
        .replace(/^\s*[-*+]\s+/gmu, '')
        .replace(/^\s*\d+\.\s+/gmu, '')
        .replace(/[*_~|-]+/gu, ' ')
        .replace(/<[^>]+>/gu, ' ')

    return collapseWhitespace(plainText)
}

export function truncatePlainText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text
    }

    return `${text.slice(0, maxLength).trimEnd()}...`
}

export function resolveCitableExcerpt(options: {
    summary?: string | null
    content?: string | null
    maxLength?: number
}): string {
    const summary = collapseWhitespace(options.summary?.trim() || '')
    if (summary) {
        return truncatePlainText(summary, options.maxLength ?? 320)
    }

    const plainContent = stripMarkdownToPlainText(options.content || '')
    return truncatePlainText(plainContent, options.maxLength ?? 320)
}

export function extractFaqItemsFromMarkdown(markdown: string, maxItems: number = 5): FaqItem[] {
    if (!markdown || maxItems <= 0) {
        return []
    }

    const lines = markdown.split(/\r?\n/u)
    const items: FaqItem[] = []
    let activeFenceMarker: string | null = null

    for (let index = 0; index < lines.length; index += 1) {
        const rawLine = lines[index] || ''
        const fenceMarker = resolveFenceMarker(rawLine)

        if (fenceMarker) {
            activeFenceMarker = activeFenceMarker === fenceMarker ? null : fenceMarker
            continue
        }

        if (activeFenceMarker) {
            continue
        }

        const currentLine = rawLine.trim()
        const headingMatch = /^#{1,6}\s+(.+?)(?:\s+#+\s*)?$/u.exec(currentLine)

        if (!headingMatch) {
            continue
        }

        const question = collapseWhitespace(headingMatch[1] || '')
        if (!/[?？]$/u.test(question)) {
            continue
        }

        const answerLines: string[] = []
        let answerFenceMarker: string | null = null

        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
            const rawNextLine = lines[cursor] || ''
            const nextFenceMarker = resolveFenceMarker(rawNextLine)

            if (nextFenceMarker) {
                answerFenceMarker = answerFenceMarker === nextFenceMarker ? null : nextFenceMarker
                continue
            }

            if (answerFenceMarker) {
                continue
            }

            const nextLine = rawNextLine.trim() || ''

            if (/^#{1,6}\s+/u.test(nextLine)) {
                break
            }

            if (!nextLine) {
                if (answerLines.length > 0) {
                    break
                }
                continue
            }

            answerLines.push(nextLine)
        }

        const answer = resolveCitableExcerpt({
            content: answerLines.join('\n'),
            maxLength: 320,
        })

        if (!answer) {
            continue
        }

        items.push({ question, answer })

        if (items.length >= maxItems) {
            break
        }
    }

    return items
}
