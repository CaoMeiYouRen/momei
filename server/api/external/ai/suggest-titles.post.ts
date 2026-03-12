import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

const schema = z.object({
    content: z.string().min(1),
    language: z.string().min(2).max(10).optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = await readValidatedBody(event, (value) => schema.parse(value))

    const titles = await TextService.suggestTitles(body.content, body.language, user.id)

    return {
        code: 200,
        data: titles,
    }
})
