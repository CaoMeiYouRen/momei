import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { success, fail } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const query = getQuery(event)
    const language = query.language as string

    const categoryRepo = dataSource.getRepository(Category)

    const category = await categoryRepo.findOne({
        where: {
            slug,
            ...(language ? { language } : {}),
        },
        relations: ['parent'],
    })

    if (!category) {
        return fail('Category not found', 404)
    }

    // Fetch translations
    let translations: any[] = []
    if (category.translationId) {
        translations = await categoryRepo.find({
            where: { translationId: category.translationId },
            select: ['language', 'slug'],
        })
    }

    return success({
        ...category,
        translations,
    })
})
