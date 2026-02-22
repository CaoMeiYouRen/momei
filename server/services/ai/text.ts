import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { AI_PROMPTS, formatPrompt } from '@/server/utils/ai/prompt'
import logger from '@/server/utils/logger'
import { ContentProcessor } from '@/utils/shared/content-processor'
import { AI_MAX_CONTENT_LENGTH, AI_CHUNK_SIZE } from '@/utils/shared/env'

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

export class TextService extends AIBaseService {
    static async suggestTitles(
        content: string,
        language: string = 'zh-CN',
        userId?: string,
    ) {
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
        return response.content.trim()
    }

    static async refineVoice(content: string, language: string = 'zh-CN', userId?: string) {
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
        return response.content.trim()
    }

    static async optimizeManuscript(content: string, language: string = 'zh-CN', userId?: string, mode: 'speech' | 'podcast' = 'speech') {
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
        return response.content.trim()
    }

    static async expandSection(options: ExpandSectionOptions, userId?: string) {
        const { topic, sectionTitle, sectionContent, expandType, language = 'zh-CN' } = options
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
        return response.content.trim()
    }

    static async translate(content: string, to: string, userId?: string) {
        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('Provider does not support chat')
        }
        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, { content: content.slice(0, AI_CHUNK_SIZE), to })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: `Translate content to ${to}` },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logUsage({ task: 'translate', response, userId })
        return response.content.trim()
    }

    static async translateName(name: string, to: string, userId?: string) {
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
        return response.content.trim()
    }

    static async suggestSlugFromName(name: string, userId?: string) {
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
        return response.content.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    }

    static async recommendTags(content: string, existingTags: string[] = [], language: string = 'zh-CN', userId?: string) {
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

    static async* translateStream(content: string, to: string, userId?: string) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({ statusCode: 413, message: 'Content too long' })
        }

        const chunks = ContentProcessor.splitMarkdown(content, { chunkSize: AI_CHUNK_SIZE })
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (!chunk) {
                continue
            }
            const translated = await this.translate(chunk, to, userId)
            yield {
                content: translated,
                chunkIndex: i,
                totalChunks: chunks.length,
            }
        }
    }
}
