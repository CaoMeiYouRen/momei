import { AIBaseService } from './base'
import {
    requestTranslation,
    requestTranslationStream,
    shouldUseAsyncTranslateTask,
    translateInChunks,
    type ChunkedTranslateOptions,
    type ChunkedTranslateResult,
    type TranslateRequestOptions,
} from './text-translation'
import { TextTranslationTaskService } from './text-translation-task'
import {
    recommendCategoriesContent,
    recommendTagsContent,
    suggestSlugFromNameContent,
    summarizeTextContent,
    translateNamesContent,
} from './text-operations'
import {
    parseVisualPromptSuggestion,
    type ExpandSectionOptions,
    type RecommendCategoriesOptions,
    type ScaffoldOptions,
    type SuggestImagePromptOptions,
} from './text.shared'
import { getAIProvider } from '@/server/utils/ai'
import { AI_PROMPTS, formatPrompt } from '@/server/utils/ai/prompt'
import logger from '@/server/utils/logger'
import { ContentProcessor } from '@/utils/shared/content-processor'
import {
    AI_MAX_CONTENT_LENGTH,
    AI_CHUNK_SIZE,
} from '@/utils/shared/env'
import {
    getVisualAssetPreset,
    resolveVisualPromptDimensions,
    type AIVisualPromptContext,
} from '@/utils/shared/ai-visual-asset'

export type {
    ExpandSectionOptions,
    RecommendCategoriesOptions,
    ScaffoldOptions,
    SuggestImagePromptOptions,
} from './text.shared'

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
        const {
            title = '',
            summary = '',
            content = '',
            language = 'zh-CN',
            assetUsage = 'post-cover',
            applyMode = getVisualAssetPreset(assetUsage).applyMode,
        } = options
        const promptContent = summary.trim() || content

        if (!title && !promptContent) {
            throw createError({
                statusCode: 400,
                message: 'Title or content is required',
            })
        }

        const promptContext: AIVisualPromptContext = {
            title,
            summary,
            content: promptContent,
            language,
        }
        const defaults = resolveVisualPromptDimensions(assetUsage, promptContext)

        await this.assertTextQuota({
            userId,
            type: 'suggest_image_prompt',
            payload: {
                title,
                summary: summary.slice(0, 300),
                content: promptContent.slice(0, 500),
                language,
                assetUsage,
                applyMode,
            },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw createError({
                statusCode: 500,
                statusMessage: 'AI provider does not support chat',
            })
        }

        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_IMAGE_PROMPT, {
            assetUsage,
            title: title || 'N/A',
            contentSummary: promptContent.slice(0, 500) || 'N/A',
            language,
            typeFallback: defaults.type.fallback,
            paletteFallback: defaults.palette.fallback,
            renderingFallback: defaults.rendering.fallback,
            textFallback: defaults.text.fallback,
            moodFallback: defaults.mood.fallback,
        })

        const response = await provider.chat({
            messages: [
                { role: 'user', content: prompt },
            ],
        })

        const suggestion = parseVisualPromptSuggestion(response.content, assetUsage, applyMode, promptContext)

        this.logUsage({ task: 'suggest-image-prompt', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'suggest_image_prompt',
            provider: provider.name,
            model: response.model,
            payload: {
                title,
                summary: summary.slice(0, 300),
                content: promptContent.slice(0, 500),
                language,
                assetUsage,
                applyMode,
            },
            response: suggestion,
        })

        return suggestion
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
        await this.assertTextQuota({
            userId,
            type: 'summarize',
            payload: {
                content: content.slice(0, AI_MAX_CONTENT_LENGTH),
                maxLength,
                language,
            },
        })

        const { provider, response, summary } = await summarizeTextContent(content, maxLength, language)
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
        return summary
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

    static override async getTaskStatus(
        taskId: string,
        userId: string,
        options: {
            isAdmin?: boolean
            includeRaw?: boolean
            resumeFailed?: boolean
        } = {},
    ) {
        await TextTranslationTaskService.continueTranslateTask(taskId, userId, {
            isAdmin: options.isAdmin,
            allowFailedResume: options.resumeFailed,
        })

        return await super.getTaskStatus(taskId, userId, options)
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

        const { provider, response, translatedNames } = await translateNamesContent(normalizedNames, to)
        this.logUsage({ task: 'translate-name-batch', response: response!, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'translate_name_batch',
            provider: provider!.name,
            model: response!.model,
            payload: { names: normalizedNames, to },
            response,
            textLength: normalizedNames.join('').length,
            settlementSource: 'actual',
        })

        return translatedNames
    }

    static async suggestSlugFromName(name: string, userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'suggest_slug',
            payload: { name },
        })

        const { provider, response, slug } = await suggestSlugFromNameContent(name)
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
        return slug
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

        const { provider, response, tags } = await recommendTagsContent(content, existingTags, language)
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

        return tags
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

        const { provider, response, categories } = await recommendCategoriesContent({
            ...options,
            categories: normalizedCategories,
        })
        this.logUsage({ task: 'recommend-categories', response: response!, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'recommend_categories',
            provider: provider!.name,
            model: response!.model,
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

        return categories
    }

    static async* translateStream(content: string, to: string, userId?: string, options?: TranslateRequestOptions) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({ statusCode: 413, message: 'Content too long' })
        }

        const chunks = ContentProcessor.splitMarkdownLossless(content, { chunkSize: AI_CHUNK_SIZE })
        const provider = await getAIProvider('text')

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (!chunk) {
                continue
            }

            const field = options?.field || 'content'
            await this.assertTextQuota({
                userId,
                type: 'translate',
                payload: {
                    content: chunk.slice(0, AI_CHUNK_SIZE),
                    to,
                    sourceLanguage: options?.sourceLanguage,
                    field,
                },
            })

            let translated = ''
            let model = 'unknown'
            let usage: { promptTokens: number, completionTokens: number, totalTokens: number } | undefined

            for await (const streamedChunk of requestTranslationStream(chunk, to, provider, {
                sourceLanguage: options?.sourceLanguage,
                field,
            })) {
                translated = streamedChunk.content
                model = streamedChunk.model || model
                usage = streamedChunk.usage || usage

                yield {
                    delta: streamedChunk.delta,
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    isChunkComplete: false,
                }
            }

            yield {
                chunkIndex: i,
                totalChunks: chunks.length,
                isChunkComplete: true,
            }

            const response = {
                content: translated,
                model,
                usage,
            }

            this.logUsage({ task: 'translate-stream', response, userId })
            await this.recordTask({
                userId,
                category: 'text',
                type: 'translate',
                provider: provider.name,
                model,
                payload: {
                    content: chunk.slice(0, AI_CHUNK_SIZE),
                    to,
                    sourceLanguage: options?.sourceLanguage,
                    field,
                },
                response,
                textLength: chunk.length,
                settlementSource: 'actual',
            })
        }
    }
}
