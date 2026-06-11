import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'

/** category 和 tag 共享的基础字段 */
export const taxonomyNameAndSlug = {
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }),
}

/** 查询公共字段 */
export const taxonomyLanguageAndTranslation = {
    language: z.string().optional(),
    translationId: z.string().optional(),
}
