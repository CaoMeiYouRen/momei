import { z } from 'zod'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { TextService } from '@/server/services/ai'

const expandSchema = z.object({
    topic: z.string(),
    sectionTitle: z.string(),
    sectionContent: z.string(),
    expandType: z.enum(['argument', 'case', 'question', 'reference', 'data']),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const body = await readBody(event)
    const options = expandSchema.parse(body)

    const expansion = await TextService.expandSection(options, session.user.id)

    return {
        code: 200,
        message: 'Section expanded successfully',
        data: expansion,
    }
})
