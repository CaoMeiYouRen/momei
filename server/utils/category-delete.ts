import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { ensureFound } from '@/server/utils/response'

/**
 * 安全删除分类，包含关联文章和子分类的检查
 * 供内部和外部 API 复用
 */
export async function safeDeleteCategory(id: string) {
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
    return category
}
