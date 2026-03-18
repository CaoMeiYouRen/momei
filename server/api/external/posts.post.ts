import { externalPostImportSchema } from '@/utils/schemas/external-post-import'
import { validateImportPathAliases } from '@/server/services/import-path-alias'
import { createPostService } from '@/server/services/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    const body = await readValidatedBody(event, (b) => externalPostImportSchema.parse(b))

    const needsImportValidation = Boolean(body.slug || body.abbrlink || body.permalink || body.sourceFile)
    let canonicalSlug = body.slug

    if (needsImportValidation) {
        const report = await validateImportPathAliases({
            title: body.title,
            slug: body.slug,
            abbrlink: body.abbrlink,
            permalink: body.permalink,
            language: body.language,
            category: body.category,
            createdAt: body.createdAt,
            sourceFile: body.sourceFile,
        })

        if (!report.canImport || report.hasBlockingIssues) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Import path alias validation failed',
                data: report,
            })
        }

        if (report.requiresConfirmation && body.confirmPathAliases !== true) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Import path aliases require confirmation',
                data: report,
            })
        }

        canonicalSlug = report.canonicalSlug || body.slug
    }

    const {
        abbrlink: _abbrlink,
        permalink: _permalink,
        sourceFile: _sourceFile,
        confirmPathAliases: _confirmPathAliases,
        ...createInput
    } = body

    const post = await createPostService({
        ...createInput,
        slug: canonicalSlug,
    }, user.id, {
        isAdmin: user.role === 'admin',
        auditContext: {
            ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
            userAgent: getRequestHeader(event, 'user-agent') || null,
        },
    })

    const host = getRequestHost(event)
    const protocol = getRequestProtocol(event)

    return {
        code: 200,
        data: {
            id: post.id,
            url: `${protocol}://${host}/posts/${post.slug}`,
        },
    }
})
