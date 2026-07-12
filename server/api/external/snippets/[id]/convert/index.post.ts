import { dataSource } from '@/server/database'
import { Snippet } from '@/server/entities/snippet'
import { SnippetStatus } from '@/types/snippet'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { ensureFound } from '@/server/utils/response'
import { createPostService } from '@/server/services/post'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRequiredRouterParam(event, 'id')

    const snippetRepo = dataSource.getRepository(Snippet)
    const snippet = ensureFound(await snippetRepo.findOne({
        where: { id },
        relations: { author: true },
    }), 'Snippet')

    // Non-admins can only convert their own snippets
    if (!isAdmin(user.role) && snippet.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (snippet.status !== SnippetStatus.INBOX) {
        throw createError({ statusCode: 400, statusMessage: 'Only inbox snippets can be converted to posts' })
    }

    // Use the snippet content to create a new post draft
    const post = await createPostService({
        title: snippet.content.slice(0, 100).replace(/\n/g, ' ').trim() || 'Untitled',
        content: snippet.content,
        status: 'draft',
    }, user.id, {
        isAdmin: isAdmin(user.role),
        auditContext: {
            ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
            userAgent: getRequestHeader(event, 'user-agent') || null,
        },
    })

    // Mark snippet as converted and link to the new post
    snippet.status = SnippetStatus.CONVERTED
    snippet.postId = post.id
    await snippetRepo.save(snippet)

    const host = getRequestHost(event)
    const protocol = getRequestProtocol(event)

    return {
        code: 200,
        data: {
            postId: post.id,
            snippetId: snippet.id,
            url: `${protocol}://${host}/posts/${post.slug}`,
        },
    }
})
