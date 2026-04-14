import { Brackets, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostOrdering } from '@/server/utils/post-ordering'
import { applyPostListSelect } from '@/server/utils/post-list-query'
import { success } from '@/server/utils/response'
import { getLocaleRegistryItem } from '@/i18n/config/locale-registry'
import {
    HOMEPAGE_LATEST_POST_LIMIT,
    HOMEPAGE_PINNED_POST_LIMIT,
    MAX_PINNED_POSTS,
} from '@/utils/shared/post-pinning'
import { isAdmin } from '@/utils/shared/roles'

const homePostQuerySchema = z.object({
    language: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (value) => homePostQuerySchema.parse(value))
    const user = event.context?.user

    if (!dataSource.isInitialized) {
        return success({ items: [] })
    }

    const postRepo = dataSource.getRepository(Post)
    const qb = applyPostListSelect(postRepo.createQueryBuilder('post'))

    try {
        await applyPostVisibilityFilter(qb, user, 'public')
    } catch (error) {
        rethrowPostAccessError(error)
    }

    if (query.language) {
        const fallbackChain = getLocaleRegistryItem(query.language).fallbackChain

        qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
            sub.where('post.translationId IS NULL')

            fallbackChain.forEach((fallbackLanguage, index) => {
                const languageParam = index === 0 ? 'language' : `fallbackLanguage${index}`
                const params: Record<string, string | string[]> = {
                    [languageParam]: fallbackLanguage,
                }

                sub.orWhere(new Brackets((candidate: WhereExpressionBuilder) => {
                    candidate.where('post.translationId IS NOT NULL')
                        .andWhere(`post.language = :${languageParam}`, params)

                    const previousLanguages = fallbackChain.slice(0, index)
                    if (previousLanguages.length > 0) {
                        const previousLanguagesParam = `previousLanguages${index}`
                        candidate.andWhere((subQb: SelectQueryBuilder<Post>) => {
                            const existsQuery = subQb.subQuery()
                                .select('1')
                                .from(Post, 'p2')
                                .where('p2.translationId = post.translationId')
                                .andWhere('p2.status = :publishedStatus', { publishedStatus: 'published' })
                                .andWhere(`p2.language IN (:...${previousLanguagesParam})`, {
                                    [previousLanguagesParam]: previousLanguages,
                                })
                                .getQuery()

                            return `NOT EXISTS ${existsQuery}`
                        })
                    }
                }))
            })
        }))
    }

    applyPostOrdering(qb, {
        alias: 'post',
        orderBy: 'publishedAt',
        order: 'DESC',
        prioritizePinned: true,
    })

    qb.take(HOMEPAGE_LATEST_POST_LIMIT + MAX_PINNED_POSTS)

    const items = await qb.getMany()
    applyPostsReadModelFromMetadata(items)

    const isUserAdmin = user && isAdmin(user.role)
    await processAuthorsPrivacy(items, !!isUserAdmin)

    const latestItems: Post[] = []
    let pinnedCount = 0

    for (const item of items) {
        if (item.isPinned) {
            if (pinnedCount >= HOMEPAGE_PINNED_POST_LIMIT) {
                continue
            }

            pinnedCount += 1
        }

        latestItems.push(item)

        if (latestItems.length >= HOMEPAGE_LATEST_POST_LIMIT) {
            break
        }
    }

    return success({
        items: latestItems,
    })
})
