import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { SnippetStatus } from '@/types/snippet'
import { requireAuth } from '@/server/utils/permission'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

const createSnippetSchema = z.object({
    content: z.string().min(1),
    media: z.array(z.string().url()).optional(),
    audioUrl: z.string().url().optional(),
    source: z.string().max(50).optional().default('web'),
    metadata: z.any().optional(),
})

export default defineEventHandler(async (event) => {
    let user: any

    // 尝试 API Key 鉴权 (供外部工具使用)
    try {
        const result = await validateApiKeyRequest(event)
        user = result.user
    } catch {
        // 尝试 Session 鉴权 (供后台 UI 使用)
        const session = await requireAuth(event)
        user = session.user
    }

    const body = await readBody(event)
    const data = createSnippetSchema.parse(body)

    const repo = dataSource.getRepository(Snippet)
    const snippet = repo.create({
        ...data,
        author: { id: user.id },
        status: SnippetStatus.INBOX,
    })

    await repo.save(snippet)

    return {
        code: 200,
        message: 'Snippet created successfully',
        data: {
            ...snippet,
            authorId: user.id, // For backward compatibility in response if needed
        },
    }
})
