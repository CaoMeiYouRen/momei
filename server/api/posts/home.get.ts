import { z } from 'zod'
import { dataSource, ensureDatabaseReady } from '@/server/database'
import { Post } from '@/server/entities/post'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostOrdering } from '@/server/utils/post-ordering'
import { applyPostListSelect, applyPublishedPostLanguageFallbackFilter } from '@/server/utils/post-list-query'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import { success } from '@/server/utils/response'
import {
    HOMEPAGE_LATEST_POST_LIMIT,
    HOMEPAGE_PINNED_POST_LIMIT,
    MAX_PINNED_POSTS,
} from '@/utils/shared/post-pinning'
import { isAdmin } from '@/utils/shared/roles'

const HOME_POSTS_CACHE_TTL_SECONDS = 60
const HOME_POSTS_CACHE_NAMESPACE = 'posts:home'

function buildHomePostsCacheKey(language?: string) {
    return buildRuntimeApiCacheKey(HOME_POSTS_CACHE_NAMESPACE, language ?? 'default')
}

const homePostQuerySchema = z.object({
    language: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (value) => homePostQuerySchema.parse(value))
    const user = event.context?.user
    const isSharedPublicResponse = !event.context?.auth?.user && !user
    const cacheKey = buildHomePostsCacheKey(query.language)

    return await withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: HOME_POSTS_CACHE_NAMESPACE,
        ttlSeconds: HOME_POSTS_CACHE_TTL_SECONDS,
        isSharedPublicResponse,
        loader: async () => {
            const databaseReady = await ensureDatabaseReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

            const postRepo = dataSource.getRepository(Post)
            const qb = applyPostListSelect(postRepo.createQueryBuilder('post'))

            try {
                await applyPostVisibilityFilter(qb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }

            applyPublishedPostLanguageFallbackFilter(qb, query.language)

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
        },
    })
})
