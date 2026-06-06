import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { formatPrompt } from '@/server/utils/ai/prompt'
import { SOCIAL_POST_PROMPT } from '@/server/utils/ai/prompts/social-post'
import { getSocialPostPlatform, SOCIAL_POST_PLATFORMS } from '@/utils/shared/social-post-platforms'
import logger from '@/server/utils/logger'
import { AI_CHUNK_SIZE } from '@/utils/shared/env'

export const SOCIAL_POST_PLATFORM_KEYS = SOCIAL_POST_PLATFORMS.map((p) => p.key) as readonly string[]

export interface SocialPostResult {
    platform: string
    content: string
}

export class SocialPostService extends AIBaseService {
    static async generate(
        title: string,
        content: string,
        platform: string,
        language: string,
        userId?: string,
    ): Promise<SocialPostResult> {
        const platformConfig = getSocialPostPlatform(platform)
        if (!platformConfig) {
            throw createError({ statusCode: 400, statusMessage: `Unsupported platform: ${platform}` })
        }

        await this.assertQuotaAllowance({
            userId,
            category: 'text',
            type: 'social_post_generation',
            payload: { title, contentLength: content.length, platform, language },
        })

        const provider = await getAIProvider('text')
        if (!provider.chat) {
            throw new Error('AI provider does not support chat')
        }

        const prompt = formatPrompt(SOCIAL_POST_PROMPT, {
            title,
            content: content.slice(0, AI_CHUNK_SIZE),
            platformLabel: platformConfig.key,
            platformGuideline: platformConfig.promptGuideline,
            language,
        })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are a social media copywriter. Return JSON only.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        this.logUsage({ task: 'social-post-generation', response, userId })
        await this.recordTask({
            userId,
            category: 'text',
            type: 'social_post_generation',
            provider: provider.name,
            model: response.model,
            payload: { title, contentLength: content.length, platform, language },
            response: { content: response.content },
            textLength: content.length,
            language,
        })

        let parsed: { content: string }
        try {
            const cleaned = response.content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim()
            parsed = JSON.parse(cleaned)
        } catch (e) {
            logger.warn('[SocialPost] Failed to parse AI response', e instanceof Error ? e.message : String(e))
            return { platform, content: `[Failed to generate] ${response.content.slice(0, 200)}` }
        }

        return {
            platform,
            content: parsed.content || '',
        }
    }
}
