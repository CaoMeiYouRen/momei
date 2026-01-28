import { submissionService } from '@/server/services/submission'
import { requireAdmin } from '@/server/utils/permission'
import { SubmissionStatus } from '@/types/submission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 10)
    const status = query.status as SubmissionStatus

    const data = await submissionService.getSubmissions({ page, limit, status })

    return {
        code: 200,
        data,
    }
})
