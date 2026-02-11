import { In } from 'typeorm'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAuth } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { createPostsZip } from '@/server/services/post-export'

const exportSchema = z.object({
    ids: z.array(z.string()).min(1),
})

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => exportSchema.parse(b))
    const session = await requireAuth(event)
    const isUserAdmin = isAdmin(session.user.role)

    const postRepo = dataSource.getRepository(Post)

    // 查询条件：如果是管理员则查询所有选中的，否则仅查询属于自己的
    const where: any = { id: In(body.ids) }
    if (!isUserAdmin) {
        where.authorId = session.user.id
    }

    const posts = await postRepo.find({
        where,
        relations: ['category', 'tags', 'author'],
    })

    if (posts.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'No posts found to export' })
    }

    const zipBuffer = await createPostsZip(posts)
    const date = new Date().toISOString().split('T')[0]
    const filename = `momei-export-${date}.zip`

    setHeaders(event, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    })

    return zipBuffer
})
