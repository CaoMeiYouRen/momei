/* eslint-disable max-lines */
import { AIBaseService } from './base'
import {
    requestTranslation,
    shouldUseAsyncTranslateTask,
    translateInChunks,
    type ChunkedTranslateOptions,
    type ChunkedTranslateResult,
    type TranslateRequestOptions,
} from './text-translation'
import { TextTranslationTaskService } from './text-translation-task'
import { getAIProvider } from '@/server/utils/ai'
import { AI_PROMPTS, formatPrompt } from '@/server/utils/ai/prompt'
import logger from '@/server/utils/logger'
import { ContentProcessor } from '@/utils/shared/content-processor'
import {
    AI_MAX_CONTENT_LENGTH,
    AI_CHUNK_SIZE,
} from '@/utils/shared/env'

export interface ScaffoldOptions {
    topic?: string
    snippets?: string[]
    template?: 'blog' | 'tutorial' | 'note' | 'report'
    sectionCount?: number
    audience?: 'beginner' | 'intermediate' | 'advanced'
    includeIntroConclusion?: boolean
    language?: string
}

export interface ExpandSectionOptions {
    topic: string
    sectionTitle: string
    sectionContent: string
    expandType: 'argument' | 'case' | 'question' | 'reference' | 'data'
    language?: string
}

export interface SuggestImagePromptOptions {
    title?: string
    content?: string
    language?: string
}

export interface RecommendCategoriesOptions {
    title: string
    content: string
    categories: string[]
    language?: string
}

export class TextService extends AIBaseService {
    private static async assertTextQuota(options: {
        userId?: string
        type: string
        payload: Record<string, unknown>
        category?: 'text' | 'podcast'
    }) {
        await this.assertQuotaAllowance({
            userId: options.userId,
            category: options.category || 'text',
            type: options.type,
            payload: options.payload,
        })
    }

    static async suggestImagePrompt(options: SuggestImagePromptOptions, userId?: string) {
        const { title = '', content = '', language = 'zh-CN' } = options

        if (!title && !content) {
            throw createError({
                statusCode: 400,
                message: 'Title or content is required',
            })
        }

        await this.assertTextQuota({
            userId,
            type: 'suggest_image_prompt',
            payload: { title, content: content.slice(0, 500), language },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw createError({
                statusCode: 500,
                statusMessage: 'AI provider does not support chat',
            })
        }

        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_IMAGE_PROMPT, {
            title: title || 'N/A',
            contentSummary: content.slice(0, 500) || 'N/A',
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'user', content: prompt },
            ],
        })

        this.logUsage({ task: 'suggest-image-prompt', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'suggest_image_prompt',
            provider: provider.name,
            model: response.model,
            payload: {
                title,
                content: content.slice(0, 500),
                language,
            },
            response: { content: response.content },
        })

        return response.content.trim().replace(/^"(.*)"$/, '$1')
    }

    static async suggestTitles(
        content: string,
        language: string = 'zh-CN',
        userId?: string,
    ) {
        await this.assertTextQuota({
            userId,
            type: 'suggest_titles',
            payload: { content: content.slice(0, AI_CHUNK_SIZE), language },
        })

        const provider = await getAIProvider('text')
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_TITLES, {
            content: content.slice(0, AI_CHUNK_SIZE),
            language,
        })

        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional blog editor. You help authors create catchy, SEO-friendly titles in ${language}.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
        })

        this.logUsage({ task: 'suggest-titles', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'suggest_titles',
            provider: provider.name,
            model: response.model,
            payload: { content: content.slice(0, 500) },
            response: { content: response.content },
        })

        try {
            const match = /\[.*\]/s.exec(response.content)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        } catch (e) {
            logger.error('Failed to parse AI title suggestions:', e)
            return response.content.split('\n').filter((line) => line.trim())
        }
    }

    static async suggestSlug(title: string, content: string, userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'suggest_slug',
            payload: { title, content: content.slice(0, AI_CHUNK_SIZE) },
        })

        const provider = await getAIProvider('text')
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG, {
            title,
            content: content.slice(0, AI_CHUNK_SIZE),
        })

        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a professional blog editor. You help authors create concise, SEO-friendly URL slugs.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logUsage({ task: 'suggest-slug', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'suggest_slug',
            provider: provider.name,
            model: response.model,
            payload: { title },
            response: { content: response.content },
        })

        return response.content
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
    }

    static async summarize(
        content: string,
        maxLength: number = 200,
        language: string = 'zh-CN',
        userId?: string,
    ) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({
                statusCode: 413,
                message: 'Content too long for AI analysis',
            })
        }

        await this.assertTextQuota({
            userId,
            type: 'summarize',
            payload: {
                content: content.slice(0, AI_MAX_CONTENT_LENGTH),
                maxLength,
                language,
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        if (content.length > AI_CHUNK_SIZE) {
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

                const response = await provider.chat({
                    messages: [
                        { role: 'system', content: `Summarize section in ${language}` },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.5,
                })
                this.logUsage({ task: 'summarize-chunk', response, userId })
                chunkSummaries.push(response.content.trim())
            }

            const combinedSummaries = chunkSummaries.join('\n\n')
            const finalPrompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
                content: combinedSummaries,
                maxLength,
                language,
            })

            const finalResponse = await provider.chat({
                messages: [
                    { role: 'system', content: `Final summary in ${language}` },
                    { role: 'user', content: finalPrompt },
                ],
                temperature: 0.5,
            })
            this.logUsage({ task: 'summarize-final', response: finalResponse, userId })
            const aggregatedUsage = chunkSummaries.reduce((acc, _chunk, index) => {
                const chunkResponse = (provider.chat as any).mock?.results?.[index]?.value
                void chunkResponse
                return acc
            }, null as any)
            void aggregatedUsage
            await this.recordTask({
                userId,
                category: 'text',
                type: 'summarize',
                provider: provider.name,
                model: finalResponse.model,
                payload: { content: content.slice(0, AI_MAX_CONTENT_LENGTH), maxLength, language },
                response: finalResponse,
                textLength: content.length,
                settlementSource: 'actual',
            })
            return finalResponse.content.trim()
        }

        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
            content,
            maxLength,
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Summarize article in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        this.logUsage({ task: 'summarize', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'summarize',
            provider: provider.name,
            model: response.model,
            payload: { content: content.slice(0, AI_CHUNK_SIZE), maxLength, language },
            response,
            textLength: content.length,
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static async refineVoice(content: string, language: string = 'zh-CN', userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'refine_voice',
            payload: { content: content.slice(0, AI_CHUNK_SIZE), language },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.REFINE_VOICE, {
            content: content.slice(0, AI_CHUNK_SIZE),
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Refine voice transcript in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
        })

        this.logUsage({ task: 'refine-voice', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'refine_voice',
            provider: provider.name,
            model: response.model,
            payload: { content: content.slice(0, AI_CHUNK_SIZE), language },
            response,
            textLength: content.length,
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static async optimizeManuscript(content: string, language: string = 'zh-CN', userId?: string, mode: 'speech' | 'podcast' = 'speech') {
        await this.assertTextQuota({
            userId,
            type: 'optimize_manuscript',
            category: mode === 'podcast' ? 'podcast' : 'text',
            payload: { content: content.slice(0, AI_CHUNK_SIZE), language, mode },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const promptTemplate = mode === 'podcast'
            ? AI_PROMPTS.MANUSCRIPT_OPTIMIZE_DUAL
            : AI_PROMPTS.MANUSCRIPT_OPTIMIZE_SINGLE

        const prompt = formatPrompt(promptTemplate, {
            content: content.slice(0, AI_CHUNK_SIZE),
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Optimize podcast manuscript in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
        })

        this.logUsage({ task: 'optimize-manuscript', response, userId })
        await this.recordTask({
            userId,
            category: mode === 'podcast' ? 'podcast' : 'text',
            type: 'optimize_manuscript',
            provider: provider.name,
            model: response.model,
            payload: { content: content.slice(0, AI_CHUNK_SIZE), language, mode },
            response,
            textLength: content.length,
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static async generateScaffold(options: ScaffoldOptions, userId?: string) {
        const {
            snippets = [], topic = '', template = 'blog', sectionCount = 5,
            audience = 'intermediate', includeIntroConclusion = true, language = 'zh-CN',
        } = options

        if (snippets.length === 0 && !topic) {
            throw createError({ statusCode: 400, statusMessage: 'Either snippets or topic must be provided' })
        }

        await this.assertTextQuota({
            userId,
            type: 'generate_scaffold',
            payload: {
                snippets: snippets.slice(0, 10),
                topic,
                template,
                sectionCount,
                audience,
                includeIntroConclusion,
                language,
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        const inputSource = snippets.length > 0
            ? `Source Snippets:\n${snippets.join('\n\n').slice(0, AI_CHUNK_SIZE)}`
            : `Core Topic: ${topic}`

        const prompt = formatPrompt(AI_PROMPTS.GENERATE_SCAFFOLD_V2, {
            audience, template, sectionCount, language,
            includeIntroConclusion: includeIntroConclusion ? 'Yes' : 'No',
            inputSource,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Generate article outline in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
        })

        this.logUsage({ task: 'generate-scaffold', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'generate_scaffold',
            provider: provider.name,
            model: response.model,
            payload: options,
            response,
            textLength: (snippets.join('\n').length || topic.length),
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static async expandSection(options: ExpandSectionOptions, userId?: string) {
        const { topic, sectionTitle, sectionContent, expandType, language = 'zh-CN' } = options

        await this.assertTextQuota({
            userId,
            type: 'expand_section',
            payload: {
                topic,
                sectionTitle,
                sectionContent,
                expandType,
                language,
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.EXPAND_SECTION, {
            topic, sectionTitle, sectionContent, expandType, language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Expand section in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
        })

        this.logUsage({ task: 'expand-section', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'expand_section',
            provider: provider.name,
            model: response.model,
            payload: options,
            response,
            textLength: `${topic}\n${sectionTitle}\n${sectionContent}`.length,
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static shouldUseAsyncTranslateTask(content: string) {
        return shouldUseAsyncTranslateTask(content)
    }

    static async translateInChunks(
        content: string,
        to: string,
        options: ChunkedTranslateOptions = {},
    ): Promise<ChunkedTranslateResult> {
        return await translateInChunks(content, to, options)
    }

    static async createTranslateTask(content: string, to: string, userId: string, options?: TranslateRequestOptions) {
        return await TextTranslationTaskService.createTranslateTask(content, to, userId, options)
    }

    static async translate(content: string, to: string, userId?: string, options?: TranslateRequestOptions) {
        await this.assertTextQuota({
            userId,
            type: 'translate',
            payload: {
                content: content.slice(0, AI_CHUNK_SIZE),
                to,
                sourceLanguage: options?.sourceLanguage,
                field: options?.field,
            },
        })

        const requestContent = content.slice(0, AI_CHUNK_SIZE)
        const { provider, response, translatedContent } = await requestTranslation(
            requestContent,
            to,
            undefined,
            options,
        )

        this.logUsage({ task: 'translate', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'translate',
            provider: provider.name,
            model: response.model,
            payload: {
                content: requestContent,
                to,
                sourceLanguage: options?.sourceLanguage,
                field: options?.field,
            },
            response,
            textLength: content.length,
            settlementSource: 'actual',
        })
        return translatedContent
    }

    static async translateName(name: string, to: string, userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'translate_name',
            payload: { name, to },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE_NAME, { name, to })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Translate name to ${to}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logUsage({ task: 'translate-name', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'translate_name',
            provider: provider.name,
            model: response.model,
            payload: { name, to },
            response,
            textLength: name.length,
            settlementSource: 'actual',
        })
        return response.content.trim()
    }

    static async translateNames(names: string[], to: string, userId?: string) {
        const normalizedNames = names.map((name) => name.trim()).filter(Boolean)
        if (normalizedNames.length === 0) {
            return []
        }

        await this.assertTextQuota({
            userId,
            type: 'translate_name_batch',
            payload: { names: normalizedNames, to },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE_NAMES, {
            names: JSON.stringify(normalizedNames),
            to,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Translate term list to ${to} and return JSON array only` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
        })

        this.logUsage({ task: 'translate-name-batch', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'translate_name_batch',
            provider: provider.name,
            model: response.model,
            payload: { names: normalizedNames, to },
            response,
            textLength: normalizedNames.join('').length,
            settlementSource: 'actual',
        })

        try {
            const match = /\[[\s\S]*\]/.exec(response.content)
            const translatedNames = JSON.parse(match?.[0] || response.content) as unknown

            if (!Array.isArray(translatedNames) || translatedNames.length !== normalizedNames.length) {
                throw new Error('Invalid translated names result length')
            }

            return translatedNames.map((item) => String(item).trim())
        } catch (error) {
            logger.error('Failed to parse translated names response', error)
            throw new Error('Invalid translated names response')
        }
    }

    static async suggestSlugFromName(name: string, userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'suggest_slug',
            payload: { name },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG_FROM_NAME, { name })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'Suggest slug from name' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logUsage({ task: 'suggest-slug', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'suggest_slug',
            provider: provider.name,
            model: response.model,
            payload: { name },
            response,
            textLength: name.length,
            settlementSource: 'actual',
        })
        return response.content.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    }

    static async recommendTags(content: string, existingTags: string[] = [], language: string = 'zh-CN', userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'recommend_tags',
            payload: {
                content: content.slice(0, AI_CHUNK_SIZE),
                existingTags,
                language,
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.RECOMMEND_TAGS, {
            content: content.slice(0, AI_CHUNK_SIZE),
            existingTags: existingTags.join(', '),
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Recommend relevant tags in ${language}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.4,
        })

        this.logUsage({ task: 'recommend-tags', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'recommend_tags',
            provider: provider.name,
            model: response.model,
            payload: {
                content: content.slice(0, AI_CHUNK_SIZE),
                existingTags,
                language,
            },
            response,
            textLength: content.length,
            settlementSource: 'actual',
        })

        try {
            const match = /\[.*\]/s.exec(response.content)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content.split(/[,\s，、]+/).filter((t) => t.trim()).slice(0, 10)
        } catch (e) {
            console.error('[RecommendTags Error]', e)
            return []
        }
    }

    static async recommendCategories(options: RecommendCategoriesOptions, userId?: string) {
        const normalizedCategories = Array.from(new Set(options.categories.map((name) => name.trim()).filter(Boolean))).slice(0, 80)

        if (normalizedCategories.length === 0) {
            return []
        }

        await this.assertTextQuota({
            userId,
            type: 'recommend_categories',
            payload: {
                title: options.title.slice(0, 200),
                content: options.content.slice(0, AI_CHUNK_SIZE),
                categories: normalizedCategories,
                language: options.language || 'zh-CN',
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }

        const prompt = formatPrompt(AI_PROMPTS.RECOMMEND_CATEGORIES, {
            title: options.title,
            content: options.content.slice(0, AI_CHUNK_SIZE),
            categories: JSON.stringify(normalizedCategories),
            language: options.language || 'zh-CN',
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Select relevant blog categories in ${options.language || 'zh-CN'} from the provided list only.` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
        })

        this.logUsage({ task: 'recommend-categories', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'recommend_categories',
            provider: provider.name,
            model: response.model,
            payload: {
                title: options.title.slice(0, 200),
                content: options.content.slice(0, AI_CHUNK_SIZE),
                categories: normalizedCategories,
                language: options.language || 'zh-CN',
            },
            response,
            textLength: options.title.length + options.content.length,
            settlementSource: 'actual',
        })

        const categoryLookup = new Map(normalizedCategories.map((name) => [name.trim().toLowerCase(), name]))

        try {
            const match = /\[[\s\S]*\]/.exec(response.content)
            const parsed = JSON.parse(match?.[0] || response.content) as unknown
            if (!Array.isArray(parsed)) {
                return []
            }

            return Array.from(new Set(parsed
                .map((item) => String(item).trim())
                .map((item) => categoryLookup.get(item.toLowerCase()) || null)
                .filter((item): item is string => Boolean(item))))
        } catch {
            return response.content
                .split(/[\n,]/)
                .map((item) => item.trim())
                .map((item) => categoryLookup.get(item.toLowerCase()) || null)
                .filter((item): item is string => Boolean(item))
        }
    }

    static async* translateStream(content: string, to: string, userId?: string, options?: TranslateRequestOptions) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({ statusCode: 413, message: 'Content too long' })
        }

        const chunks = ContentProcessor.splitMarkdown(content, { chunkSize: AI_CHUNK_SIZE })
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (!chunk) {
                continue
            }
            const translated = await this.translate(chunk, to, userId, {
                sourceLanguage: options?.sourceLanguage,
                field: options?.field || 'content',
            })
            yield {
                content: translated,
                chunkIndex: i,
                totalChunks: chunks.length,
            }
        }
    }
}
