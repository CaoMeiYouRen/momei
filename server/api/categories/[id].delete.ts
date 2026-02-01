import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    await requireAdmin(event)

    const categoryRepo = dataSource.getRepository(Category)
    const postRepo = dataSource.getRepository(Post)

    const category = await categoryRepo.findOneBy({ id })
    ensureFound(category, 'Category')

    // Check for associated posts
    const postCount = await postRepo.count({ where: { category: { id } } })
    if (postCount > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: `Cannot delete category with ${postCount} associated posts. Please move or delete them first.`,
        })
    }

    // Check for children categories
    const childrenCount = await categoryRepo.count({ where: { parentId: id } })
    if (childrenCount > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: `Cannot delete category with ${childrenCount} sub-categories. Please move or delete them first.`,
        })
    }

    await categoryRepo.remove(category)

    return success(null, 200)
})
