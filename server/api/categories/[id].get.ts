import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    const categoryRepo = dataSource.getRepository(Category)

    // Try to find by ID first
    const category = await categoryRepo.findOne({
        where: { id },
        relations: ['parent', 'children'],
    })

    ensureFound(category, 'Category')

    return success(category)
})
