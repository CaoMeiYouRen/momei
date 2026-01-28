import { submissionService } from '~/server/services/submission'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing submission ID',
            })
        }

        await submissionService.deleteSubmission(Number(id))

        return {
            code: 200,
            message: 'Submission deleted',
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
