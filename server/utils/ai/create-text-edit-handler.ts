import { z } from 'zod'
import { requireAdminOrAuthor } from '@/server/utils/permission'

/**
 * AI 文本改写类端点（缩写 / 续写 / 扩写 / 改写）共用的请求体校验。
 */
export const textEditRequestSchema = z.object({
    content: z.string().min(1),
    style: z.enum(['formal', 'casual', 'academic', 'technical', 'creative', 'concise']).optional().default('casual'),
    language: z.string().optional().default('zh-CN'),
})

export type TextEditRequest = z.infer<typeof textEditRequestSchema>
export type TextEditRunner = (body: TextEditRequest, userId: string) => Promise<string>

/**
 * 生成「鉴权 → 校验 → 调用 TextService」同构的 AI 文本改写端点。
 *
 * 四个端点只在具体 `TextService` 方法上不同，其余请求校验与响应壳层保持一致；
 * 统一在此实现，避免校验口径与响应结构在四个文件间漂移。
 */
export function createTextEditHandler(run: TextEditRunner) {
    return defineEventHandler(async (event) => {
        const session = await requireAdminOrAuthor(event)

        const body = await readValidatedBody(event, (value) => textEditRequestSchema.parse(value))

        return {
            code: 200,
            data: await run(body, session.user.id),
        }
    })
}
