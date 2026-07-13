import { z } from 'zod'
import type { H3Event } from 'h3'
import type { TranslateRequestOptions } from '@/server/services/ai/text-translation'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { aiTranslateSchema } from '@/utils/schemas/ai'

type TranslateField = Exclude<z.infer<typeof aiTranslateSchema>['field'], undefined>

export interface ParsedTranslateBody {
    content: string
    field?: TranslateField
    session: Awaited<ReturnType<typeof requireAdminOrAuthor>>
    sourceLanguage?: string
    targetLanguage: string
    translationOptions: TranslateRequestOptions | undefined
}

/**
 * 解析 translate.post / translate.stream.post 公共的请求参数。
 * 校验鉴权、请求体与 schema，返回类型安全的解析结果。
 */
export async function parseTranslateBody(event: H3Event): Promise<ParsedTranslateBody> {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const result = aiTranslateSchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const { content, targetLanguage, sourceLanguage, field } = result.data
    const translationOptions: TranslateRequestOptions | undefined = sourceLanguage || field
        ? { sourceLanguage, field }
        : undefined

    return {
        content,
        field,
        session,
        sourceLanguage,
        targetLanguage,
        translationOptions,
    }
}

export { TextService }
