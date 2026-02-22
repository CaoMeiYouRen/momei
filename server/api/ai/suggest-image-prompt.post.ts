import { defineEventHandler, readBody } from 'h3'
import { getAIProvider } from '~/server/utils/ai'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { title, content, language = 'zh-CN' } = body

    if (!title && !content) {
        throw createError({
            statusCode: 400,
            message: 'Title or content is required',
        })
    }

    const provider = await getAIProvider()

    const prompt = `
You are a professional blog cover artist.
Your task is to create a high-quality, artistic, and visually striking image prompt for AI image generators (DALL-E, Stable Diffusion, etc).
The image should represent the core theme of the following blog post.

Title: ${title || 'N/A'}
Content Summary: ${content?.substring(0, 500) || 'N/A'}

Rules for the prompt:
1. Describe a scene or abstract concept that is professional and high-end.
2. Mention artistic style (e.g., "minimalist digital art", "vivid oil painting", "isometric 3D render", "clean modern photography").
3. Mention lighting and color palette (e.g., "warm cinematic lighting", "soft pastel colors", "dark mode neon style").
4. Response ONLY with the final prompt content, no other text.
5. Provide the prompt in the following language: ${language}.
6. Keep it under 200 words.
`

    if (!provider.chat) {
        throw createError({
            statusCode: 500,
            statusMessage: 'AI provider does not support chat',
        })
    }

    const response = await provider.chat({
        messages: [
            { role: 'user', content: prompt },
        ],
    })

    return {
        data: response.content.trim().replace(/^"(.*)"$/, '$1'),
    }
})
