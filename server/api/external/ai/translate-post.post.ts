import { PostAutomationService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { aiTranslatePostSchema } from '@/utils/schemas/ai'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = await readValidatedBody(event, (value) => aiTranslatePostSchema.parse(value))

    const task = await PostAutomationService.createTranslatePostTask(body, {
        userId: user.id,
        isAdmin: isAdmin(user.role),
    })

    return {
        code: 200,
        data: {
            taskId: task.id,
            status: task.status,
        },
    }
})
