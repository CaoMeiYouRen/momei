import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { SnippetStatus } from '@/types/snippet'
import { requireAuth } from '@/server/utils/permission'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { snippetBodySchema } from '@/utils/schemas/snippet'

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
    const data = snippetBodySchema.parse(body)

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
