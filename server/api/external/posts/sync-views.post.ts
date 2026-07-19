/**
 * POST /api/external/posts/sync-views
 *
 * 从 D1 导出的阅读量数据同步到 Momei 的 PostgreSQL。
 * 合并策略：取 `max(现有阅读量, D1 阅读量)`，避免重复执行导致累加。
 *
 * 请求体：
 *   { entries: Array<{ url: string, views?: number, time?: number }> }
 *
 * url 格式：/archives/<slug>.html
 * views/time 格式：非负整数
 */
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

const syncViewsEntrySchema = z.object({
    url: z.string().min(1),
    /** 阅读量。D1 counters 表中字段名为 time，也兼容 views */
    views: z.number().int().min(0).optional(),
    time: z.number().int().min(0).optional(),
})

const syncViewsSchema = z.object({
    entries: z.array(syncViewsEntrySchema).min(1).max(1000),
})

interface SyncViewsEntryResult {
    url: string
    slug: string | null
    status: 'synced' | 'skipped' | 'not-found' | 'error'
    message: string
}

const ARCHIVES_URL_RE = /^\/archives\/(.+)\.html$/

function extractSlugFromUrl(url: string): string | null {
    // 匹配 /archives/<slug>.html 格式
    const match = ARCHIVES_URL_RE.exec(url)
    if (!match?.[1]) {
        return null
    }
    return match[1]
}

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    // 仅管理员可同步阅读量
    if (user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
    }

    const body = await readValidatedBody(event, (b) => syncViewsSchema.parse(b))
    const postRepo = dataSource.getRepository(Post)

    const details: SyncViewsEntryResult[] = []

    for (const entry of body.entries) {
        // 支持 D1 的 time 字段名和通用的 views 字段名
        const viewCount = entry.views ?? entry.time
        if (viewCount === undefined || viewCount < 0) {
            details.push({
                url: entry.url,
                slug: null,
                status: 'error',
                message: `条目缺少有效的 views 或 time 字段`,
            })
            continue
        }

        const slug = extractSlugFromUrl(entry.url)

        if (!slug) {
            details.push({
                url: entry.url,
                slug: null,
                status: 'error',
                message: `无法从 URL 中解析 slug：${entry.url}`,
            })
            continue
        }

        try {
            // 通过 slug 查找文章（不限制语言，因为 slug 在同一语言内唯一）
            const post = await postRepo.findOne({
                where: { slug },
                select: { id: true, slug: true, views: true },
            })

            if (!post) {
                details.push({
                    url: entry.url,
                    slug,
                    status: 'not-found',
                    message: `未找到 slug 为 "${slug}" 的文章`,
                })
                continue
            }

            // 取两者中更大的值，避免重复执行导致累加
            if (viewCount <= post.views) {
                details.push({
                    url: entry.url,
                    slug,
                    status: 'skipped',
                    message: `文章 "${slug}" 现有阅读量 ${post.views} ≥ D1 ${viewCount}，保留现有值`,
                })
                continue
            }

            await postRepo.update(post.id, { views: viewCount })
            details.push({
                url: entry.url,
                slug,
                status: 'synced',
                message: `文章 "${slug}" 阅读量从 ${post.views} 更新为 ${viewCount}`,
            })
        } catch (error) {
            details.push({
                url: entry.url,
                slug,
                status: 'error',
                message: error instanceof Error ? error.message : '未知错误',
            })
        }
    }

    const synced = details.filter((d) => d.status === 'synced').length
    const skipped = details.filter((d) => d.status === 'skipped').length
    const notFound = details.filter((d) => d.status === 'not-found').length
    const errors = details.filter((d) => d.status === 'error').length

    return {
        code: 200,
        data: {
            synced,
            skipped,
            notFound,
            errors,
            total: details.length,
            details,
        },
    }
})
