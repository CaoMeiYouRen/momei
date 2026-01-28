import { getAIProvider } from '../utils/ai'
import { AI_PROMPTS, formatPrompt } from '../utils/ai/prompt'
import logger from '../utils/logger'
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

export class AIService {
    private static logAIUsage(task: string, response: any, userId?: string) {
        const { model, usage } = response
        if (usage) {
            logger.info(
                `AI Usage: task=${task}, model=${model}, userId=${userId || 'anonymous'}, promptTokens=${usage.promptTokens}, completionTokens=${usage.completionTokens}, totalTokens=${usage.totalTokens}`,
            )
        } else {
            logger.info(
                `AI Usage: task=${task}, model=${model}, userId=${userId || 'anonymous'}, usage=unknown`,
            )
        }
    }

    static async suggestTitles(
        content: string,
        language: string = 'zh-CN',
        userId?: string,
    ) {
        const provider = await await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_TITLES, {
            content: content.slice(0, AI_CHUNK_SIZE),
            language,
        })

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

        this.logAIUsage('suggest-titles', response, userId)

        try {
            // Try to extract JSON array from response
            const match = response.content.match(/\[.*\]/s)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        } catch (e) {
            console.error('Failed to parse AI title suggestions:', e)
            return response.content.split('\n').filter((line) => line.trim())
        }
    }

    static async suggestSlug(title: string, content: string, userId?: string) {
        const provider = await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG, {
            title,
            content: content.slice(0, AI_CHUNK_SIZE),
        })

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

        this.logAIUsage('suggest-slug', response, userId)

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
                statusMessage: 'Content too long for AI analysis',
            })
        }

        const provider = await getAIProvider()

        // 如果内容超过 AI_CHUNK_SIZE，使用分段摘要策略
        if (content.length > AI_CHUNK_SIZE) {
            const chunks = ContentProcessor.splitMarkdown(content, {
                chunkSize: AI_CHUNK_SIZE,
            })
            const chunkSummaries: string[] = []

            for (const chunk of chunks) {
                const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
                    content: chunk,
                    // 稍微多预留一点长度给子摘要，最后再汇总
                    maxLength: Math.round(maxLength / chunks.length) + 100,
                    language,
                })

                const response = await provider.chat({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional blog editor. You help authors summarize a section of their article in ${language}.`,
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.5,
                })
                this.logAIUsage('summarize-chunk', response, userId)
                chunkSummaries.push(response.content.trim())
            }

            // 对摘要的摘要进行最终总结
            const combinedSummaries = chunkSummaries.join('\n\n')
            const finalPrompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
                content: combinedSummaries,
                maxLength,
                language,
            })

            const finalResponse = await provider.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional blog editor. You help authors create a final summary from multiple section summaries in ${language}.`,
                    },
                    { role: 'user', content: finalPrompt },
                ],
                temperature: 0.5,
            })
            this.logAIUsage('summarize-final', finalResponse, userId)
            return finalResponse.content.trim()
        }

        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
            content,
            maxLength,
            language,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional blog editor. You help authors summarize their articles for SEO in ${language}.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        this.logAIUsage('summarize', response, userId)

        return response.content.trim()
    }

    static async generateScaffold(
        options: ScaffoldOptions,
        userId?: string,
    ) {
        const {
            snippets = [],
            topic = '',
            template = 'blog',
            sectionCount = 5,
            audience = 'intermediate',
            includeIntroConclusion = true,
            language = 'zh-CN',
        } = options

        const provider = await getAIProvider()

        let inputSource = ''
        if (snippets.length > 0) {
            const snippetsText = snippets.map((s, i) => `Snippet ${i + 1}:\n${s}`).join('\n\n---\n\n')
            inputSource = `Source Snippets:\n${snippetsText.slice(0, AI_CHUNK_SIZE)}`
        } else if (topic) {
            inputSource = `Core Topic: ${topic}`
        } else {
            throw createError({
                statusCode: 400,
                statusMessage: 'Either snippets or topic must be provided',
            })
        }

        const prompt = formatPrompt(AI_PROMPTS.GENERATE_SCAFFOLD_V2, {
            audience,
            template,
            sectionCount,
            includeIntroConclusion: includeIntroConclusion ? 'Yes' : 'No',
            inputSource,
            language,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional blog editor helping an author organize ideas into an article outline in ${language}.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
        })

        this.logAIUsage('generate-scaffold-v2', response, userId)

        return response.content.trim()
    }

    static async expandSection(
        options: ExpandSectionOptions,
        userId?: string,
    ) {
        const {
            topic,
            sectionTitle,
            sectionContent,
            expandType,
            language = 'zh-CN',
        } = options

        const provider = await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.EXPAND_SECTION, {
            topic,
            sectionTitle,
            sectionContent,
            expandType,
            language,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional blog editor. You help authors expand a specific section of their article outline in ${language} with ${expandType} suggestions.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
        })

        this.logAIUsage('expand-section', response, userId)

        return response.content.trim()
    }

    static async recommendTags(
        content: string,
        existingTags: string[] = [],
        language: string = 'zh-CN',
        userId?: string,
    ) {
        const provider = await getAIProvider()
        const prompt = `Based on the following content, recommend 3-5 tags in ${language}.
        Current existing tags in the system (use these if possible): ${existingTags.join(', ')}.
        Prefer existing tags if they match, or suggest new ones in ${language} if necessary.
        Output as a JSON array of strings:

        ${content.slice(0, AI_CHUNK_SIZE)}`

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional blog editor. You help authors tag their articles for better discoverability in ${language}.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        this.logAIUsage('recommend-tags', response, userId)

        try {
            const match = response.content.match(/\[.*\]/s)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content
                .split(/[,，\n]/)
                .map((t) => t.trim())
                .filter(Boolean)
        } catch (e) {
            console.error('Failed to parse AI tag recommendations:', e)
            return []
        }
    }

    static async translateName(
        name: string,
        targetLanguage: string,
        userId?: string,
    ) {
        const provider = await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE_NAME, {
            name,
            to: targetLanguage,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. You help translate blog categories and tags into ${targetLanguage}.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logAIUsage('translate-name', response, userId)

        return response.content.trim()
    }

    static async suggestSlugFromName(name: string, userId?: string) {
        const provider = await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG_FROM_NAME, {
            name,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a professional blog editor. You help create concise, URL-friendly slugs for categories and tags.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logAIUsage('suggest-slug-from-name', response, userId)

        return response.content
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
    }

    static async translate(content: string, to: string, userId?: string) {
        // 如果内容过长，强制进行截断，除非使用流式接口（暂未在旧接口实现自动分段）
        const safeContent = content.slice(0, AI_CHUNK_SIZE)

        const provider = await getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, {
            content: safeContent,
            to,
        })

        const response = await provider.chat({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. You help translate blog posts into ${to} while preserving Markdown structure.`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
        })

        this.logAIUsage('translate', response, userId)

        return response.content.trim()
    }

    /**
     * 流式翻译长文章
     */
    static async* translateStream(
        content: string,
        to: string,
        userId?: string,
    ) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({
                statusCode: 413,
                message: `Content too long (max ${AI_MAX_CONTENT_LENGTH} characters)`,
            })
        }

        const chunks = ContentProcessor.splitMarkdown(content, {
            chunkSize: AI_CHUNK_SIZE,
        })
        const totalChunks = chunks.length

        for (let i = 0; i < totalChunks; i++) {
            const chunk = chunks[i]
            const provider = await getAIProvider()
            const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, {
                content: chunk,
                to,
            })

            const response = await provider.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. You help translate blog posts into ${to} while preserving Markdown structure. Part ${i + 1}/${totalChunks}.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
            })

            this.logAIUsage(`translate-chunk-${i + 1}`, response, userId)

            yield {
                chunkIndex: i,
                totalChunks,
                content: response.content.trim(),
            }
        }
    }
}
