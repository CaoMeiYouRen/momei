import { externalPostImportValidateSchema } from '@/utils/schemas/external-post-import'
import { validateImportPathAliases } from '@/server/services/import-path-alias'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

export default defineEventHandler(async (event) => {
    await validateApiKeyRequest(event)

    const body = await readValidatedBody(event, (value) => externalPostImportValidateSchema.parse(value))

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

    return {
        code: 200,
        data: report,
    }
})
