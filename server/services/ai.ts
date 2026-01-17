import { getAIProvider } from '../utils/ai'
import { AI_PROMPTS, formatPrompt } from '../utils/ai/prompt'
import logger from '../utils/logger'

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
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_TITLES, {
            content: content.slice(0, 4000),
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
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_SLUG, {
            title,
            content: content.slice(0, 2000),
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
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, {
            content: content.slice(0, 4000),
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

    static async recommendTags(
        content: string,
        existingTags: string[] = [],
        language: string = 'zh-CN',
        userId?: string,
    ) {
        const provider = getAIProvider()
        const prompt = `Based on the following content, recommend 3-5 tags in ${language}.
        Current existing tags in the system (use these if possible): ${existingTags.join(', ')}.
        Prefer existing tags if they match, or suggest new ones in ${language} if necessary.
        Output as a JSON array of strings:

        ${content.slice(0, 4000)}`

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
        const provider = getAIProvider()
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
        const provider = getAIProvider()
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
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.TRANSLATE, {
            content,
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
}
