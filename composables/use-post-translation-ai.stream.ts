export interface TranslationStreamChunk {
    content?: string
    chunk?: string
    delta?: string
    chunkIndex?: number
    totalChunks?: number
    isChunkComplete?: boolean
}

export async function extractTranslationStreamError(response: Response, fallbackMessage: string) {
    const responseText = await response.text().catch(() => '')
    if (!responseText) {
        return fallbackMessage
    }

    try {
        const parsed = JSON.parse(responseText) as { message?: string, statusMessage?: string }
        return parsed.message || parsed.statusMessage || responseText
    } catch {
        return responseText
    }
}

export function normalizeTranslationStreamChunk(payload: unknown): TranslationStreamChunk {
    if (typeof payload === 'string') {
        return { content: payload }
    }

    if (payload && typeof payload === 'object') {
        return payload as TranslationStreamChunk
    }

    return {}
}

export function resolveTranslationChunkContent(currentContent: string, chunk: TranslationStreamChunk) {
    if (typeof chunk.content === 'string' && chunk.content.length > 0) {
        return chunk.content
    }

    if (typeof chunk.chunk === 'string' && chunk.chunk.length > 0) {
        return chunk.chunk
    }

    if (typeof chunk.delta === 'string' && chunk.delta.length > 0) {
        return `${currentContent}${chunk.delta}`
    }

    return currentContent
}

export async function parseTranslationSSEBlock(
    block: string,
    onChunk: (chunk: TranslationStreamChunk) => Promise<void> | void,
    toErrorMessage: (payload: unknown) => string,
) {
    const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length === 0) {
        return false
    }

    let eventName = 'message'
    const dataLines: string[] = []

    for (const line of lines) {
        if (line.startsWith('event:')) {
            eventName = line.slice(6).trim() || 'message'
            continue
        }

        if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim())
        }
    }

    if (eventName === 'end') {
        return true
    }

    const rawData = dataLines.join('\n')
    if (!rawData) {
        return false
    }

    let payload: unknown = rawData
    try {
        payload = JSON.parse(rawData)
    } catch {
        payload = rawData
    }

    if (eventName === 'error') {
        throw new Error(toErrorMessage(payload))
    }

    await onChunk(normalizeTranslationStreamChunk(payload))
    return false
}

export async function readTranslationStream(
    payload: {
        content: string
        targetLanguage: string
        sourceLanguage: string
        field: string
    },
    signal: AbortSignal,
    onChunk: (chunk: TranslationStreamChunk) => Promise<void> | void,
    options: {
        fallbackMessage: string
        toErrorMessage: (payload: unknown) => string
    },
) {
    const response = await fetch('/api/ai/translate.stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        },
        body: JSON.stringify({
            content: payload.content,
            targetLanguage: payload.targetLanguage,
            sourceLanguage: payload.sourceLanguage,
            field: payload.field,
        }),
        signal,
    })

    if (!response.ok) {
        throw new Error(await extractTranslationStreamError(response, options.fallbackMessage))
    }

    if (!response.body) {
        throw new Error(options.fallbackMessage)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

        const blocks = buffer.split(/\r?\n\r?\n/)
        buffer = blocks.pop() || ''

        for (const block of blocks) {
            const shouldEnd = await parseTranslationSSEBlock(block, onChunk, options.toErrorMessage)
            if (shouldEnd) {
                return
            }
        }

        if (done) {
            break
        }
    }

    if (buffer.trim()) {
        await parseTranslationSSEBlock(buffer, onChunk, options.toErrorMessage)
    }
}
