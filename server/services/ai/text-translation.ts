import { getAIProvider } from '@/server/utils/ai'
import { AI_PROMPTS, formatPrompt } from '@/server/utils/ai/prompt'
import { ContentProcessor, preserveMarkdownChunkBoundary } from '@/utils/shared/content-processor'
import {
    AI_MAX_CONTENT_LENGTH,
    AI_TEXT_DIRECT_RETURN_MAX_CHARS,
    AI_TEXT_TASK_CHUNK_SIZE,
    AI_TEXT_TASK_CONCURRENCY,
} from '@/utils/shared/env'
import type { AIChatResponse, AIUsageSnapshot } from '@/types/ai'
import type { TranslationTextField } from '@/types/post-translation'

export interface TranslateRequestOptions {
    sourceLanguage?: string
    field?: TranslationTextField
    signal?: AbortSignal
}

export interface ChunkedTranslateOptions {
    chunkSize?: number
    concurrency?: number
    sourceLanguage?: string
    onChunkComplete?: (state: {
        completedChunks: number
        totalChunks: number
    }) => Promise<void> | void
}

export interface ChunkedTranslateResult {
    content: string
    chunkCount: number
    provider: string
    model: string
    usage?: AIChatResponse['usage']
    usageSnapshot: AIUsageSnapshot
}

export interface TranslationStreamResponseChunk {
    providerName: string
    model: string
    content: string
    delta?: string
    usage?: AIChatResponse['usage']
    raw?: unknown
}

function mergeChatUsage(
    current: AIChatResponse['usage'] | undefined,
    next: AIChatResponse['usage'] | undefined,
): AIChatResponse['usage'] | undefined {
    if (!current && !next) {
        return undefined
    }

    return {
        promptTokens: (current?.promptTokens || 0) + (next?.promptTokens || 0),
        completionTokens: (current?.completionTokens || 0) + (next?.completionTokens || 0),
        totalTokens: (current?.totalTokens || 0) + (next?.totalTokens || 0),
    }
}

export async function requestTranslation(
    content: string,
    to: string,
    providerArg?: Awaited<ReturnType<typeof getAIProvider>>,
    options: TranslateRequestOptions = {},
) {
    const provider = providerArg || await getAIProvider('text')

    if (!provider.chat) {
        throw new Error('Provider does not support chat')
    }

    const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, { content, to })
    const systemPrompt = [
        `Translate ${options.field || 'content'} to ${to}.`,
        options.sourceLanguage ? `Source language is ${options.sourceLanguage}.` : 'Auto-detect the source language.',
        'Preserve markdown structure, links, and code blocks when present.',
    ].join(' ')
    const response = await provider.chat({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        signal: options.signal,
    })

    return {
        provider,
        response,
        translatedContent: options.field === 'title' || options.field === 'summary'
            ? response.content.trim()
            : response.content,
    }
}

export async function* requestTranslationStream(
    content: string,
    to: string,
    providerArg?: Awaited<ReturnType<typeof getAIProvider>>,
    options: TranslateRequestOptions = {},
): AsyncGenerator<TranslationStreamResponseChunk, void, void> {
    const provider = providerArg || await getAIProvider('text')

    if (!provider.chat) {
        throw new Error('Provider does not support chat')
    }

    const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, { content, to })
    const systemPrompt = [
        `Translate ${options.field || 'content'} to ${to}.`,
        options.sourceLanguage ? `Source language is ${options.sourceLanguage}.` : 'Auto-detect the source language.',
        'Preserve markdown structure, links, and code blocks when present.',
    ].join(' ')
    const requestOptions = {
        messages: [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: prompt },
        ],
        temperature: 0.3,
        stream: true,
    }

    if (provider.chatStream) {
        let emittedChunk = false
        let accumulatedContent = ''
        let resolvedModel = ''

        for await (const chunk of provider.chatStream(requestOptions)) {
            const nextContent = chunk.content ?? `${accumulatedContent}${chunk.delta || ''}`
            const delta = chunk.delta ?? (nextContent.startsWith(accumulatedContent)
                ? nextContent.slice(accumulatedContent.length)
                : nextContent)

            accumulatedContent = nextContent
            resolvedModel = chunk.model || resolvedModel

            if (!delta && !nextContent) {
                continue
            }

            emittedChunk = true
            yield {
                providerName: provider.name,
                model: resolvedModel || 'unknown',
                content: accumulatedContent,
                delta,
                usage: chunk.usage,
                raw: chunk.raw,
            }
        }

        if (emittedChunk) {
            return
        }
    }

    const { response, translatedContent } = await requestTranslation(content, to, provider, options)
    yield {
        providerName: provider.name,
        model: response.model,
        content: translatedContent,
        delta: translatedContent,
        usage: response.usage,
        raw: response.raw,
    }
}

export function shouldUseAsyncTranslateTask(content: string) {
    return content.length >= AI_TEXT_DIRECT_RETURN_MAX_CHARS
}

export async function translateInChunks(
    content: string,
    to: string,
    options: ChunkedTranslateOptions = {},
): Promise<ChunkedTranslateResult> {
    if (content.length > AI_MAX_CONTENT_LENGTH) {
        throw createError({
            statusCode: 413,
            message: 'Content too long',
        })
    }

    const chunkSize = Math.max(200, options.chunkSize || AI_TEXT_TASK_CHUNK_SIZE)
    const concurrency = Math.max(1, options.concurrency || AI_TEXT_TASK_CONCURRENCY)
    const chunks = ContentProcessor.splitMarkdownLossless(content, {
        chunkSize,
        minChunkSize: Math.min(200, chunkSize),
    })

    const provider = await getAIProvider('text')
    if (!provider.chat) {
        throw new Error('Provider does not support chat')
    }

    const translatedChunks = new Array<string>(chunks.length)
    let completedChunks = 0
    let nextIndex = 0
    let aggregatedUsage: AIChatResponse['usage'] | undefined
    let resolvedModel = ''

    const workerCount = Math.min(concurrency, Math.max(chunks.length, 1))
    const runWorker = async () => {
        while (nextIndex < chunks.length) {
            const currentIndex = nextIndex
            nextIndex += 1
            const chunk = chunks[currentIndex]

            if (!chunk) {
                continue
            }

            const { response, translatedContent } = await requestTranslation(
                chunk,
                to,
                provider,
                {
                    sourceLanguage: options.sourceLanguage,
                    field: 'content',
                },
            )

            resolvedModel = resolvedModel || response.model
            aggregatedUsage = mergeChatUsage(aggregatedUsage, response.usage)
            translatedChunks[currentIndex] = preserveMarkdownChunkBoundary(chunk, translatedContent)
            completedChunks += 1

            await options.onChunkComplete?.({
                completedChunks,
                totalChunks: chunks.length,
            })
        }
    }

    await Promise.all(Array.from({ length: workerCount }, () => runWorker()))

    const translatedContent = translatedChunks.filter(Boolean).join('')
    return {
        content: translatedContent,
        chunkCount: chunks.length,
        provider: provider.name,
        model: resolvedModel || 'unknown',
        usage: aggregatedUsage,
        usageSnapshot: {
            requestCount: chunks.length,
            promptTokens: aggregatedUsage?.promptTokens,
            completionTokens: aggregatedUsage?.completionTokens,
            totalTokens: aggregatedUsage?.totalTokens,
            textChars: content.length,
            outputChars: translatedContent.length,
        },
    }
}
