import { getAIProvider } from '@/server/utils/ai'
import { AI_PROMPTS, formatPrompt } from '@/server/utils/ai/prompt'
import logger from '@/server/utils/logger'
import { ContentProcessor } from '@/utils/shared/content-processor'
import {
    AI_CHUNK_SIZE,
    AI_MAX_CONTENT_LENGTH,
} from '@/utils/shared/env'
import { normalizeStringList, splitAndNormalizeStringList } from '@/utils/shared/string-list'

interface RecommendCategoriesRequestOptions {
    title: string
    content: string
    categories: string[]
    language?: string
}

function assertChatProvider(provider: Awaited<ReturnType<typeof getAIProvider>>) {
    if (!provider.chat) {
        throw new Error('Provider does not support chat')
    }

    return provider.chat.bind(provider)
}

export async function summarizeTextContent(content: string, maxLength: number, language: string) {
    if (content.length > AI_MAX_CONTENT_LENGTH) {
        throw createError({
            statusCode: 413,
            message: 'Content too long for AI analysis',
        })
    }

    const provider = await getAIProvider('text')
    const chat = assertChatProvider(provider)

    if (content.length <= AI_CHUNK_SIZE) {
        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
            content,
            maxLength,
            language,
        })

        const response = await chat({
            messages: [
                { role: 'system', content: `Summarize article in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        return {
            provider,
            response,
            summary: response.content.trim(),
        }
    }

    const chunks = ContentProcessor.splitMarkdown(content, {
        chunkSize: AI_CHUNK_SIZE,
    })
    const chunkSummaries: string[] = []

    for (const chunk of chunks) {
        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
            content: chunk,
            maxLength: Math.round(maxLength / chunks.length) + 100,
            language,
        })

        const response = await chat({
            messages: [
                { role: 'system', content: `Summarize section in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })
        chunkSummaries.push(response.content.trim())
    }

    const finalPrompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
        content: chunkSummaries.join('\n\n'),
        maxLength,
        language,
    })

    const response = await chat({
        messages: [
            { role: 'system', content: `Final summary in ${language}` },
            { role: 'user', content: finalPrompt },
        ],
        temperature: 0.5,
    })

    return {
        provider,
        response,
        summary: response.content.trim(),
    }
}

export async function translateNamesContent(names: string[], to: string) {
    const normalizedNames = normalizeStringList(names)
    if (normalizedNames.length === 0) {
        return {
            provider: null,
            response: null,
            translatedNames: [] as string[],
        }
    }

    const provider = await getAIProvider('text')
    const chat = assertChatProvider(provider)
    const prompt = formatPrompt(AI_PROMPTS.TRANSLATE_NAMES, {
        names: JSON.stringify(normalizedNames),
        to,
    })

    const response = await chat({
        messages: [
            { role: 'system', content: `Translate term list to ${to} and return JSON array only` },
            { role: 'user', content: prompt },
        ],
        temperature: 0.2,
    })

    try {
        const match = /\[[\s\S]*\]/.exec(response.content)
        const translatedNames = JSON.parse(match?.[0] || response.content) as unknown

        if (!Array.isArray(translatedNames) || translatedNames.length !== normalizedNames.length) {
            throw new Error('Invalid translated names result length')
        }

        return {
            provider,
            response,
            translatedNames: translatedNames.map((item) => String(item).trim()),
        }
    } catch (error) {
        logger.error('Failed to parse translated names response', error)
        throw new Error('Invalid translated names response')
    }
}

export async function suggestSlugFromNameContent(name: string) {
    const provider = await getAIProvider('text')
    const chat = assertChatProvider(provider)
    const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG_FROM_NAME, { name })

    const response = await chat({
        messages: [
            { role: 'system', content: 'Suggest slug from name' },
            { role: 'user', content: prompt },
        ],
        temperature: 0.3,
    })

    return {
        provider,
        response,
        slug: response.content.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    }
}

export async function recommendTagsContent(content: string, existingTags: string[], language: string) {
    const provider = await getAIProvider('text')
    const chat = assertChatProvider(provider)
    const prompt = formatPrompt(AI_PROMPTS.RECOMMEND_TAGS, {
        content: content.slice(0, AI_CHUNK_SIZE),
        existingTags: existingTags.join(', '),
        language,
    })

    const response = await chat({
        messages: [
            { role: 'system', content: `Recommend relevant tags in ${language}` },
            { role: 'user', content: prompt },
        ],
        temperature: 0.4,
    })

    try {
        const match = /\[.*\]/s.exec(response.content)
        const tags = match
            ? JSON.parse(match[0]) as string[]
            : splitAndNormalizeStringList(response.content, {
                delimiters: /[,\s，、]+/,
                limit: 10,
            })

        return { provider, response, tags }
    } catch (error) {
        logger.error('[RecommendTags Error]', error)
        return { provider, response, tags: [] as string[] }
    }
}

export async function recommendCategoriesContent(options: RecommendCategoriesRequestOptions) {
    const normalizedCategories = normalizeStringList(options.categories, {
        dedupe: true,
        limit: 80,
    })
    if (normalizedCategories.length === 0) {
        return {
            provider: null,
            response: null,
            categories: [] as string[],
        }
    }

    const language = options.language || 'zh-CN'
    const provider = await getAIProvider('text')
    const chat = assertChatProvider(provider)
    const prompt = formatPrompt(AI_PROMPTS.RECOMMEND_CATEGORIES, {
        title: options.title,
        content: options.content.slice(0, AI_CHUNK_SIZE),
        categories: JSON.stringify(normalizedCategories),
        language,
    })

    const response = await chat({
        messages: [
            { role: 'system', content: `Select relevant blog categories in ${language} from the provided list only.` },
            { role: 'user', content: prompt },
        ],
        temperature: 0.2,
    })

    const categoryLookup = new Map(normalizedCategories.map((name) => [name.trim().toLowerCase(), name]))
    const parseCategory = (item: string) => categoryLookup.get(item.trim().toLowerCase()) || null

    try {
        const match = /\[[\s\S]*\]/.exec(response.content)
        const parsed = JSON.parse(match?.[0] || response.content) as unknown
        if (!Array.isArray(parsed)) {
            return { provider, response, categories: [] as string[] }
        }

        return {
            provider,
            response,
            categories: Array.from(new Set(parsed
                .map((item) => parseCategory(String(item)))
                .filter((item): item is string => Boolean(item)))),
        }
    } catch {
        return {
            provider,
            response,
            categories: splitAndNormalizeStringList(response.content, {
                delimiters: /[\n,]/,
            })
                .map((item) => parseCategory(item))
                .filter((item): item is string => Boolean(item)),
        }
    }
}
