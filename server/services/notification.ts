import { convert } from 'html-to-text'
import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { InAppNotification } from '@/server/entities/in-app-notification'
import { MarketingCampaignStatus, MarketingCampaignType, AdminNotificationEvent, NotificationType } from '@/utils/shared/notification'
import { sendEmail } from '@/server/utils/email'
import { emailService } from '@/server/utils/email/service'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { isAdmin } from '@/utils/shared/roles'
import logger from '@/server/utils/logger'

/**
 * 发送管理员站务通知
 */
export async function notifyAdmins(event: AdminNotificationEvent, data: { title: string, content: string }) {
    const settingsRepo = dataSource.getRepository(AdminNotificationSettings)
    const setting = await settingsRepo.findOne({ where: { event } })

    // Default to email enabled if no setting found
    const isEmailEnabled = setting ? setting.isEmailEnabled : true
    const isBrowserEnabled = setting ? setting.isBrowserEnabled : false

    if (!isEmailEnabled && !isBrowserEnabled) {
        return
    }

    const userRepo = dataSource.getRepository(User)
    // Find all users with admin role (comma separated roles string check)
    const admins = await userRepo.createQueryBuilder('user')
        .where('user.role LIKE :role', { role: '%admin%' })
        .getMany()

    for (const admin of admins) {
        if (!isAdmin(admin.role)) {
            continue
        } // Final check

        if (isEmailEnabled) {
            try {
                await sendEmail({
                    to: admin.email,
                    subject: `[站务通知] ${data.title}`,
                    html: data.content,
                })
            } catch (err) {
                logger.error(`Failed to send admin notification email to ${admin.email}:`, err)
            }
        }

        if (isBrowserEnabled) {
            // TODO: Implement browser push (Sse / Socket.io / WebPush)
        }
    }
}

/**
 * 从文章创建营销推送
 */
export async function createCampaignFromPost(
    postId: string,
    senderId: string,
    status: MarketingCampaignStatus = MarketingCampaignStatus.DRAFT,
    criteria?: { categoryIds?: string[], tagIds?: string[] },
) {
    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id: postId },
        relations: ['category', 'tags', 'author'],
    })
    if (!post) {
        throw new Error('Post not found')
    }

    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl || 'https://momei.app'

    // 构造文章链接
    const langPrefix = post.language === 'zh-CN' ? '' : `/${post.language}`
    const postUrl = `${siteUrl}${langPrefix}/posts/${post.slug || post.id}`

    // 格式化元数据
    const authorName = post.author?.name || 'Admin'
    const categoryName = post.category?.name || '未分类'
    const publishDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleString(post.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : ''

    const campaign = new MarketingCampaign()
    campaign.title = post.title

    // 提取正文摘要，不带多余的 HTML 容器，真正的模板在发送阶段渲染
    campaign.content = post.summary || convert(post.content, {
        wordwrap: false,
        selectors: [
            { selector: 'img', format: 'skip' },
            { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        ],
    }).substring(0, 200).trim()

    campaign.type = MarketingCampaignType.BLOG_POST
    campaign.senderId = senderId
    campaign.status = status
    campaign.targetCriteria = {
        ...(criteria || {
            categoryIds: post.categoryId ? [post.categoryId] : [],
            tagIds: post.tags?.map((t) => t.id) || [],
        }),
        articleId: post.id,
        articleTitle: post.title,
        authorName,
        categoryName,
        publishDate,
        articleLink: postUrl,
    }

    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    await campaignRepo.save(campaign)
    return campaign
}

/**
 * 获取符合条件的订阅者
 */
export async function getTargetSubscribers(criteria: { categoryIds?: string[], tagIds?: string[] }) {
    const repo = dataSource.getRepository(Subscriber)
    const query = repo.createQueryBuilder('subscriber')
        .where('subscriber.isActive = :isActive', { isActive: true })
        .andWhere('subscriber.isMarketingEnabled = :isMarketingEnabled', { isMarketingEnabled: true })

    if (criteria.categoryIds && criteria.categoryIds.length > 0) {
        // Simple-json filtering is tricky in TypeORM with different DBs.
        // For simplicity, we fetch all and filter in memory if simple-json is used,
        // or use LIKE if we can assume Postgres/MySQL behavior.
        // Actually, let's just fetch all active marketing-enabled subscribers for now
        // or improve this later with a more robust JSON query if needed.
    }

    const subscribers = await query.getMany()

    // Filter by criteria manually to be safe across different database types (sqlite/mysql/pg)
    return subscribers.filter((sub) => {
        if (criteria.categoryIds && criteria.categoryIds.length > 0) {
            const hasCategory = sub.subscribedCategoryIds?.some((id) => criteria.categoryIds!.includes(id))
            if (!hasCategory) {
                return false
            }
        }
        if (criteria.tagIds && criteria.tagIds.length > 0) {
            const hasTag = sub.subscribedTagIds?.some((id) => criteria.tagIds!.includes(id))
            if (!hasTag) {
                return false
            }
        }
        return true
    })
}

/**
 * 发送营销推送
 */
export async function sendMarketingCampaign(campaignId: string) {
    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const campaign = await campaignRepo.findOne({ where: { id: campaignId } })

    if (!campaign || campaign.status === MarketingCampaignStatus.SENDING || campaign.status === MarketingCampaignStatus.COMPLETED) {
        return
    }

    campaign.status = MarketingCampaignStatus.SENDING
    await campaignRepo.save(campaign)

    try {
        const subscribers = await getTargetSubscribers(campaign.targetCriteria || {})

        logger.info(`Starting to send campaign "${campaign.title}" to ${subscribers.length} subscribers`)

        let successCount = 0
        let failCount = 0

        for (const subscriber of subscribers) {
            try {
                await emailService.sendMarketingEmail(
                    subscriber.email,
                    {
                        title: campaign.title,
                        summary: campaign.content,
                        articleTitle: campaign.targetCriteria?.articleTitle || campaign.title,
                        authorName: campaign.targetCriteria?.authorName || 'Admin',
                        categoryName: campaign.targetCriteria?.categoryName || 'General',
                        publishDate: campaign.targetCriteria?.publishDate || '',
                        actionUrl: campaign.targetCriteria?.articleLink || '/',
                    },
                    subscriber.language || 'zh-CN',
                )
                successCount++
            } catch (err) {
                logger.error(`Failed to send campaign to ${subscriber.email}:`, err)
                failCount++
            }
        }

        campaign.status = MarketingCampaignStatus.COMPLETED
        campaign.sentAt = new Date()
        await campaignRepo.save(campaign)

        logger.info(`Campaign "${campaign.title}" finished. Success: ${successCount}, Fail: ${failCount}`)
    } catch (error) {
        logger.error(`Failed to execute campaign "${campaign.title}":`, error)
        campaign.status = MarketingCampaignStatus.FAILED
        await campaignRepo.save(campaign)
    }
}

/**
 * 实时连接中心 (SSE Connections)
 */
const connections = new Map<string, Set<any>>()

/**
 * 注册实时通知连接
 */
export function registerNotificationConnection(userId: string, stream: any) {
    if (!connections.has(userId)) {
        connections.set(userId, new Set())
    }
    connections.get(userId)?.add(stream)
}

/**
 * 移除实时通知连接
 */
export function unregisterNotificationConnection(userId: string, stream: any) {
    const userConnections = connections.get(userId)
    if (userConnections) {
        userConnections.delete(stream)
        if (userConnections.size === 0) {
            connections.delete(userId)
        }
    }
}

/**
 * 发送站内通知
 */
export async function sendInAppNotification(data: {
    userId: string | null
    type: NotificationType
    title: string
    content: string
    link?: string | null
}) {
    const notificationRepo = dataSource.getRepository(InAppNotification)
    const notification = notificationRepo.create({
        ...data,
        isRead: false,
    })
    await notificationRepo.save(notification)

    // 推送实时消息
    const payload = JSON.stringify(notification)

    if (data.userId) {
        // 单个用户推送
        const userConnections = connections.get(data.userId)
        if (userConnections) {
            for (const stream of userConnections) {
                stream.push(payload)
            }
        }
    } else {
        // 全局广播推送 (userId 为 null)
        for (const userConnections of connections.values()) {
            for (const stream of userConnections) {
                stream.push(payload)
            }
        }
    }

    return notification
}
