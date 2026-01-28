import { submissionService } from '@/server/services/submission'
import { submissionReviewSchema } from '@/utils/schemas/submission'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
    }

    const result = await readValidatedBody(event, (body) => submissionReviewSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    try {
        const session = await requireAdmin(event)
        const submission = await submissionService.reviewSubmission(id, result.data, session.user.id)

        return {
            code: 200,
            message: 'Submission reviewed successfully',
            data: { id: submission.id, status: submission.status },
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
