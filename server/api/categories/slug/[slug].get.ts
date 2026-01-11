import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { success, fail } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOne({
        where: { slug },
        relations: ['parent'],
    })

    if (!category) {
        return fail('Category not found', 404)
    }

    return success(category)
})
