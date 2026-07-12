import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
    }

    const id = getRequiredRouterParam(event, 'id')

    const categoryRepo = dataSource.getRepository(Category)
    const postRepo = dataSource.getRepository(Post)

    const category = ensureFound(await categoryRepo.findOneBy({ id }), 'Category')

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

    return {
        code: 200,
        message: 'Category deleted successfully',
    }
})
