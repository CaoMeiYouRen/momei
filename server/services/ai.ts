import { getAIProvider } from '../utils/ai'
import { AI_PROMPTS, formatPrompt } from '../utils/ai/prompt'

export class AIService {
    static async suggestTitles(content: string) {
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUGGEST_TITLES, { content: content.slice(0, 4000) })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are a professional blog editor. You help authors create catchy, SEO-friendly titles.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
        })

        try {
            // Try to extract JSON array from response
            const match = response.content.match(/\[.*\]/s)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content.split('\n').filter((line) => line.trim()).map((line) => line.replace(/^\d+\.\s*/, '').trim())
        } catch (e) {
            console.error('Failed to parse AI title suggestions:', e)
            return response.content.split('\n').filter((line) => line.trim())
        }
    }

    static async summarize(content: string, maxLength: number = 200) {
        const provider = getAIProvider()
        const prompt = formatPrompt(AI_PROMPTS.SUMMARIZE, { content: content.slice(0, 4000), maxLength })

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are a professional blog editor. You help authors summarize their articles for SEO.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        return response.content.trim()
    }

    static async recommendTags(content: string, existingTags: string[] = []) {
        const provider = getAIProvider()
        const prompt = `Based on the following content, recommend 3-5 tags.
        Current existing tags in the system are: ${existingTags.join(', ')}.
        Prefer existing tags if they match, or suggest new ones if necessary.
        Output as a JSON array of strings:

        ${content.slice(0, 4000)}`

        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are a professional blog editor. You help authors tag their articles for better discoverability.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        })

        try {
            const match = response.content.match(/\[.*\]/s)
            if (match) {
                return JSON.parse(match[0]) as string[]
            }
            return response.content.split(/[,，\n]/).map((t) => t.trim()).filter(Boolean)
        } catch (e) {
            console.error('Failed to parse AI tag recommendations:', e)
            return []
        }
    }
}
