import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { snippetBodySchema } from '@/utils/schemas/snippet'
import { SnippetStatus } from '@/types/snippet'
import { toPlainObject } from '@/server/utils/object'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const body = await readValidatedBody(event, (b) => snippetBodySchema.parse(b))

    const repo = dataSource.getRepository(Snippet)
    const snippet = repo.create({
        ...body,
        author: { id: user.id },
        authorId: user.id,
        status: body.status || SnippetStatus.INBOX,
    })

    await repo.save(snippet)

    return {
        code: 200,
        message: 'Snippet created successfully',
        data: toPlainObject(snippet),
    }
})
