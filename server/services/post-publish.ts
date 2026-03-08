import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import { dataSource } from '@/server/database'
import { Post as PostEntity } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { htmlToPlainText } from '@/server/utils/html'
import logger from '@/server/utils/logger'
import { createMemo, type MemosCreateResponse } from '@/server/utils/memos'
import type { Post, PublishIntent } from '@/types/post'
import { SettingKey } from '@/types/setting'
import { buildAbsoluteUrl } from '@/utils/shared/seo'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

const MEMO_SUMMARY_MAX_LENGTH = 280

/**
 * 执行文章发布的副作用（同步到 Memos、发送推送等）
 */
export async function executePublishEffects(post: Post, intent: PublishIntent) {
    if (!post.id) {
        return
    }
    const senderId = post.authorId || '0' // 使用作者 ID 或系统 ID

    // 1. 同步到 Memos (如果开启)
    if (intent.syncToMemos) {
        try {
            await syncPostToMemos(post)
        } catch (error) {
            logger.error('[PostPublishService] Failed to sync to Memos:', error)
        }
    }

    // 2. 处理推送通知
    if (intent.pushOption && intent.pushOption !== 'none') {
        try {
            const status = intent.pushOption === 'now'
                ? MarketingCampaignStatus.SENDING
                : MarketingCampaignStatus.DRAFT

            const campaign = await createCampaignFromPost(
                post.id,
                senderId,
                status,
                intent.pushCriteria,
            )

            if (intent.pushOption === 'now' && campaign) {
                await sendMarketingCampaign(campaign.id)
            }
        } catch (error) {
            logger.error('[PostPublishService] Failed to handle push notification campaign:', error)
        }
    }
}

/**
 * 将文章摘要 and 链接同步到 Memos
 */
async function syncPostToMemos(post: Post) {
    const existingMemosId = post.metadata?.integration?.memosId
    if (existingMemosId) {
        logger.info(`[PostPublishService] Post ${post.id} already synced to Memos as ${existingMemosId}, skipping.`)
        return
    }

    const content = await buildMemoContent(post)
    logger.info(`[PostPublishService] Syncing post ${post.id} to Memos...`)

    const memo = await createMemo({ content })
    if (!memo) {
        logger.warn(`[PostPublishService] Memos sync skipped for post ${post.id} because integration is disabled.`)
        return
    }

    const memosId = resolveMemosId(memo)
    if (!memosId) {
        logger.warn(`[PostPublishService] Memo created for post ${post.id}, but no memo identifier was returned.`)
        return
    }

    await persistMemosIntegration(post, memosId)
}

async function buildMemoContent(post: Post) {
    const siteUrl = await resolveSiteUrl()
    const langPrefix = post.language === 'zh-CN' ? '' : `/${post.language}`
    const postUrl = buildAbsoluteUrl(siteUrl, `${langPrefix}/posts/${post.slug || post.id}`)
    const excerpt = buildPostExcerpt(post)

    const parts = [`# ${post.title}`]
    if (excerpt) {
        parts.push(excerpt)
    }
    parts.push(`[阅读全文](${postUrl})`)

    return parts.join('\n\n')
}

function buildPostExcerpt(post: Post) {
    const rawExcerpt = post.summary || htmlToPlainText(post.content)
    const normalizedExcerpt = rawExcerpt.replace(/\s+/gu, ' ').trim()

    if (!normalizedExcerpt) {
        return ''
    }

    if (normalizedExcerpt.length <= MEMO_SUMMARY_MAX_LENGTH) {
        return normalizedExcerpt
    }

    return `${normalizedExcerpt.slice(0, MEMO_SUMMARY_MAX_LENGTH).trimEnd()}...`
}

async function resolveSiteUrl() {
    const siteUrl = await getSetting(SettingKey.SITE_URL)
    if (siteUrl) {
        return siteUrl
    }

    const runtimeConfig = useRuntimeConfig()
    return runtimeConfig.public.siteUrl || 'https://momei.app'
}

function resolveMemosId(memo: MemosCreateResponse) {
    if (memo.uid) {
        return memo.uid
    }

    if (!memo.name) {
        return null
    }

    const memoId = memo.name.split('/').pop()
    return memoId || memo.name
}

async function persistMemosIntegration(post: Post, memosId: string) {
    const postRepo = dataSource.getRepository(PostEntity)
    const nextMetadata: NonNullable<Post['metadata']> = {
        ...(post.metadata || {}),
        integration: {
            ...(post.metadata?.integration || {}),
            memosId,
        },
    }

    const nextMetaVersion = Math.max(post.metaVersion || 0, 1)

    const persistedPost = await postRepo.findOne({ where: { id: post.id } })
    if (!persistedPost) {
        logger.warn(`[PostPublishService] Post ${post.id} was published but could not be reloaded to persist memosId.`)
        return
    }

    persistedPost.metadata = nextMetadata
    persistedPost.metaVersion = nextMetaVersion
    await postRepo.save(persistedPost)

    post.metadata = nextMetadata
    post.metaVersion = nextMetaVersion
}
