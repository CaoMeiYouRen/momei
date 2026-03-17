import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { InAppNotification } from '@/server/entities/in-app-notification'
import { NotificationSettings } from '@/server/entities/notification-settings'
import { MarketingCampaignStatus, MarketingCampaignType, AdminNotificationEvent, NotificationChannel, NotificationType, NotificationDeliveryChannel, NotificationDeliveryStatus } from '@/utils/shared/notification'
import { sendEmail } from '@/server/utils/email'
import { emailService } from '@/server/utils/email/service'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { isAdmin } from '@/utils/shared/roles'
import logger from '@/server/utils/logger'
import { htmlToPlainText } from '@/server/utils/html'
import { appendPostCopyrightNotice } from '@/utils/shared/post-copyright'
import { sendWebPushToUser } from '@/server/services/web-push'
import { recordNotificationDeliveryLog } from '@/server/services/notification-delivery'
import { dispatchListmonkCampaign, getListmonkDispatchConfig, ListmonkDispatchError, type ListmonkDispatchConfig } from '@/server/services/listmonk'

type MarketingDispatchMode = 'email' | 'listmonk'

type MarketingDispatchState = 'started' | 'not_found' | 'already_completed' | 'already_sending'

interface MarketingDispatchStartResult {
    state: MarketingDispatchState
    mode: MarketingDispatchMode
}

function getCampaignDeliveryMode(config: ListmonkDispatchConfig): MarketingDispatchMode {
    return config.enabled ? 'listmonk' : 'email'
}

function buildMarketingCampaignPayload(campaign: MarketingCampaign) {
    return {
        title: campaign.title,
        summary: campaign.content,
        articleTitle: campaign.targetCriteria?.articleTitle || campaign.title,
        authorName: campaign.targetCriteria?.authorName || 'Admin',
        categoryName: campaign.targetCriteria?.categoryName || 'General',
        publishDate: campaign.targetCriteria?.publishDate || '',
        actionUrl: campaign.targetCriteria?.articleLink || '/',
    }
}

function updateCampaignExternalDistribution(campaign: MarketingCampaign, payload: Record<string, unknown>) {
    campaign.targetCriteria = {
        ...(campaign.targetCriteria || {}),
        externalDistribution: {
            ...(campaign.targetCriteria?.externalDistribution || {}),
            listmonk: {
                ...(campaign.targetCriteria?.externalDistribution?.listmonk || {}),
                ...payload,
            },
        },
    }
}

async function recordMarketingSummaryLog(data: {
    campaign: MarketingCampaign
    channel: NotificationDeliveryChannel
    status: NotificationDeliveryStatus
    recipient: string
    errorMessage?: string | null
    metadata?: Record<string, unknown>
}) {
    await recordNotificationDeliveryLog({
        recipient: data.recipient,
        channel: data.channel,
        status: data.status,
        notificationType: NotificationType.MARKETING,
        title: data.campaign.title,
        targetUrl: data.campaign.targetCriteria?.articleLink || null,
        errorMessage: data.errorMessage || null,
        metadata: {
            campaignId: data.campaign.id,
            ...data.metadata,
        },
    })
}

async function sendCampaignByEmail(campaign: MarketingCampaign) {
    const subscribers = await getTargetSubscribers(campaign.targetCriteria || {})
    const payload = buildMarketingCampaignPayload(campaign)

    logger.info(`Starting to send campaign "${campaign.title}" to ${subscribers.length} subscribers`)

    let successCount = 0
    let failCount = 0

    for (const subscriber of subscribers) {
        try {
            await emailService.sendMarketingEmail(
                subscriber.email,
                payload,
                subscriber.language || 'zh-CN',
            )
            successCount++
        } catch (err) {
            logger.error(`Failed to send campaign to ${subscriber.email}:`, err)
            failCount++
        }
    }

    await recordMarketingSummaryLog({
        campaign,
        channel: NotificationDeliveryChannel.EMAIL,
        status: NotificationDeliveryStatus.SUCCESS,
        recipient: `${subscribers.length} subscribers`,
        metadata: {
            successCount,
            failCount,
        },
    })

    logger.info(`Campaign "${campaign.title}" finished. Success: ${successCount}, Fail: ${failCount}`)
}

async function sendCampaignByListmonk(campaign: MarketingCampaign, config: ListmonkDispatchConfig) {
    const result = await dispatchListmonkCampaign(campaign, config)

    updateCampaignExternalDistribution(campaign, {
        provider: 'listmonk',
        remoteCampaignId: result.remoteCampaignId,
        action: result.action,
        listIds: result.listIds,
        lastAttemptAt: new Date().toISOString(),
        lastSuccessfulAt: new Date().toISOString(),
        lastError: null,
    })

    await recordMarketingSummaryLog({
        campaign,
        channel: NotificationDeliveryChannel.LISTMONK,
        status: NotificationDeliveryStatus.SUCCESS,
        recipient: `listmonk:${result.remoteCampaignId}`,
        metadata: {
            action: result.action,
            listIds: result.listIds,
        },
    })
}

async function isWebPushEnabledForUser(userId: string, type: NotificationType) {
    const notificationSettingsRepo = dataSource.getRepository(NotificationSettings)
    const setting = await notificationSettingsRepo.findOne({
        where: {
            userId,
            type,
            channel: NotificationChannel.WEB_PUSH,
        },
    })

    return setting ? setting.isEnabled : true
}

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
                await recordNotificationDeliveryLog({
                    userId: admin.id,
                    recipient: admin.email,
                    channel: NotificationDeliveryChannel.EMAIL,
                    status: NotificationDeliveryStatus.SUCCESS,
                    notificationType: NotificationType.SYSTEM,
                    title: data.title,
                    targetUrl: '/admin',
                })
            } catch (err) {
                logger.error(`Failed to send admin notification email to ${admin.email}:`, err)
                await recordNotificationDeliveryLog({
                    userId: admin.id,
                    recipient: admin.email,
                    channel: NotificationDeliveryChannel.EMAIL,
                    status: NotificationDeliveryStatus.FAILED,
                    notificationType: NotificationType.SYSTEM,
                    title: data.title,
                    targetUrl: '/admin',
                    errorMessage: err instanceof Error ? err.message : String(err),
                })
            }
        }

        if (isBrowserEnabled) {
            await sendInAppNotification({
                userId: admin.id,
                type: NotificationType.SYSTEM,
                title: data.title,
                content: data.content,
                link: '/admin',
                recipient: admin.email,
            }).catch((err) => {
                logger.error(`Failed to send admin browser notification to ${admin.email}:`, err)
            })
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
    const defaultLicense = config.public.postCopyright || config.public.defaultCopyright || 'all-rights-reserved'

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
    const excerpt = post.summary || htmlToPlainText(post.content).substring(0, 200).trim()
    campaign.content = appendPostCopyrightNotice(excerpt, {
        authorName: post.author?.name || post.author?.email || null,
        url: postUrl,
        license: post.copyright,
        defaultLicense,
        locale: post.language,
    })

    campaign.type = MarketingCampaignType.BLOG_POST
    campaign.senderId = senderId
    campaign.status = status
    campaign.targetCriteria = {
        ...(criteria || {
            categoryIds: post.categoryId ? [post.categoryId] : [],
            tagIds: post.tags?.map((t) => t.id) || [],
        }),
        articleLocale: post.language,
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

    if (!campaign || campaign.status === MarketingCampaignStatus.SENDING) {
        return
    }

    const listmonkConfig = await getListmonkDispatchConfig()
    const deliveryMode = getCampaignDeliveryMode(listmonkConfig)

    if (campaign.status === MarketingCampaignStatus.COMPLETED && deliveryMode === 'email') {
        return
    }

    campaign.status = MarketingCampaignStatus.SENDING
    await campaignRepo.save(campaign)

    try {
        if (deliveryMode === 'listmonk') {
            await sendCampaignByListmonk(campaign, listmonkConfig)
        } else {
            await sendCampaignByEmail(campaign)
        }

        campaign.status = MarketingCampaignStatus.COMPLETED
        campaign.sentAt = new Date()
        await campaignRepo.save(campaign)
    } catch (error) {
        logger.error(`Failed to execute campaign "${campaign.title}":`, error)

        if (error instanceof ListmonkDispatchError) {
            updateCampaignExternalDistribution(campaign, {
                provider: 'listmonk',
                remoteCampaignId: error.remoteCampaignId,
                action: error.action,
                listIds: error.listIds,
                lastAttemptAt: new Date().toISOString(),
                lastError: error.message,
                manualAction: error.manualAction,
                failureCode: error.code,
            })

            await recordMarketingSummaryLog({
                campaign,
                channel: NotificationDeliveryChannel.LISTMONK,
                status: NotificationDeliveryStatus.FAILED,
                recipient: error.remoteCampaignId ? `listmonk:${error.remoteCampaignId}` : 'listmonk',
                errorMessage: error.manualAction ? `${error.message} ${error.manualAction}` : error.message,
                metadata: {
                    failureCode: error.code,
                    listIds: error.listIds,
                    action: error.action,
                },
            })
        } else {
            await recordMarketingSummaryLog({
                campaign,
                channel: NotificationDeliveryChannel.EMAIL,
                status: NotificationDeliveryStatus.FAILED,
                recipient: 'marketing-email',
                errorMessage: error instanceof Error ? error.message : String(error),
            })
        }

        campaign.status = MarketingCampaignStatus.FAILED
        await campaignRepo.save(campaign)
    }
}

export async function startMarketingCampaignDispatch(campaignId: string): Promise<MarketingDispatchStartResult> {
    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const campaign = await campaignRepo.findOne({ where: { id: campaignId } })
    const listmonkConfig = await getListmonkDispatchConfig()
    const mode = getCampaignDeliveryMode(listmonkConfig)

    if (!campaign) {
        return {
            state: 'not_found',
            mode,
        }
    }

    if (campaign.status === MarketingCampaignStatus.SENDING) {
        return {
            state: 'already_sending',
            mode,
        }
    }

    if (campaign.status === MarketingCampaignStatus.COMPLETED && mode === 'email') {
        return {
            state: 'already_completed',
            mode,
        }
    }

    void sendMarketingCampaign(campaignId).catch((error) => {
        logger.error(`Failed to start campaign dispatch for ${campaignId}:`, error)
    })

    return {
        state: 'started',
        mode,
    }
}

/**
 * 实时连接中心 (SSE Connections)
 */
interface NotificationStream {
    push: (payload: string) => void | Promise<void>
}

const connections = new Map<string, Set<NotificationStream>>()

/**
 * 注册实时通知连接
 */
export function registerNotificationConnection(userId: string, stream: NotificationStream) {
    if (!connections.has(userId)) {
        connections.set(userId, new Set())
    }
    connections.get(userId)?.add(stream)
}

/**
 * 移除实时通知连接
 */
export function unregisterNotificationConnection(userId: string, stream: NotificationStream) {
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
    recipient?: string | null
}) {
    const notificationRepo = dataSource.getRepository(InAppNotification)
    const notification = notificationRepo.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        link: data.link || null,
        isRead: false,
    })
    await notificationRepo.save(notification)

    const recipient = data.recipient ?? data.userId ?? 'broadcast'

    await recordNotificationDeliveryLog({
        notificationId: notification.id,
        userId: data.userId,
        recipient,
        channel: NotificationDeliveryChannel.IN_APP,
        status: NotificationDeliveryStatus.SUCCESS,
        notificationType: data.type,
        title: data.title,
        targetUrl: data.link || null,
    })

    // 推送实时消息
    const payload = JSON.stringify(notification)

    if (data.userId) {
        // 单个用户推送
        const userConnections = connections.get(data.userId)
        if (userConnections && userConnections.size > 0) {
            let delivered = false

            for (const stream of userConnections) {
                try {
                    await stream.push(payload)
                    delivered = true
                } catch (error) {
                    logger.error(`[Notification] Failed to push SSE notification ${notification.id} to user ${data.userId}:`, error)
                }
            }

            await recordNotificationDeliveryLog({
                notificationId: notification.id,
                userId: data.userId,
                recipient,
                channel: NotificationDeliveryChannel.SSE,
                status: delivered ? NotificationDeliveryStatus.SUCCESS : NotificationDeliveryStatus.FAILED,
                notificationType: data.type,
                title: data.title,
                targetUrl: data.link || null,
                errorMessage: delivered ? null : 'sse_delivery_failed',
                metadata: {
                    connectionCount: userConnections.size,
                },
            })

            await recordNotificationDeliveryLog({
                notificationId: notification.id,
                userId: data.userId,
                recipient,
                channel: NotificationDeliveryChannel.WEB_PUSH,
                status: NotificationDeliveryStatus.SKIPPED,
                notificationType: data.type,
                title: data.title,
                targetUrl: data.link || null,
                errorMessage: 'online_sse_delivery',
            })
        } else {
            const webPushEnabled = await isWebPushEnabledForUser(data.userId, data.type)

            if (!webPushEnabled) {
                await recordNotificationDeliveryLog({
                    notificationId: notification.id,
                    userId: data.userId,
                    recipient,
                    channel: NotificationDeliveryChannel.WEB_PUSH,
                    status: NotificationDeliveryStatus.SKIPPED,
                    notificationType: data.type,
                    title: data.title,
                    targetUrl: data.link || null,
                    errorMessage: 'user_disabled',
                })
            } else {
                try {
                    const result = await sendWebPushToUser(data.userId, {
                        title: data.title,
                        body: data.content,
                        tag: `notification-${notification.id}`,
                        url: data.link || '/',
                        data: {
                            notificationId: notification.id,
                            type: data.type,
                        },
                    })

                    let webPushStatus = NotificationDeliveryStatus.FAILED
                    if (result.sent > 0) {
                        webPushStatus = NotificationDeliveryStatus.SUCCESS
                    } else if (result.skipped) {
                        webPushStatus = NotificationDeliveryStatus.SKIPPED
                    }
                    const webPushErrorMessage = result.sent > 0 ? null : 'web_push_unavailable'

                    await recordNotificationDeliveryLog({
                        notificationId: notification.id,
                        userId: data.userId,
                        recipient,
                        channel: NotificationDeliveryChannel.WEB_PUSH,
                        status: webPushStatus,
                        notificationType: data.type,
                        title: data.title,
                        targetUrl: data.link || null,
                        errorMessage: webPushErrorMessage,
                        metadata: result,
                    })
                } catch (error) {
                    logger.error(`[Notification] Failed to send web push for notification ${notification.id}:`, error)
                    await recordNotificationDeliveryLog({
                        notificationId: notification.id,
                        userId: data.userId,
                        recipient,
                        channel: NotificationDeliveryChannel.WEB_PUSH,
                        status: NotificationDeliveryStatus.FAILED,
                        notificationType: data.type,
                        title: data.title,
                        targetUrl: data.link || null,
                        errorMessage: error instanceof Error ? error.message : String(error),
                    })
                }
            }
        }
    } else {
        // 全局广播推送 (userId 为 null)
        let pushedConnections = 0

        for (const userConnections of connections.values()) {
            for (const stream of userConnections) {
                try {
                    await stream.push(payload)
                    pushedConnections += 1
                } catch (error) {
                    logger.error(`[Notification] Failed to push broadcast notification ${notification.id}:`, error)
                }
            }
        }

        await recordNotificationDeliveryLog({
            notificationId: notification.id,
            recipient,
            channel: NotificationDeliveryChannel.SSE,
            status: pushedConnections > 0 ? NotificationDeliveryStatus.SUCCESS : NotificationDeliveryStatus.SKIPPED,
            notificationType: data.type,
            title: data.title,
            targetUrl: data.link || null,
            errorMessage: pushedConnections > 0 ? null : 'no_active_connections',
            metadata: {
                connectionCount: pushedConnections,
            },
        })
    }

    return notification
}

/**
 * 推送实时事件（不落库）
 */
export function pushRealtimeEvent(userId: string, payload: Record<string, unknown>) {
    const userConnections = connections.get(userId)
    if (!userConnections || userConnections.size === 0) {
        return
    }

    const serializedPayload = JSON.stringify(payload)
    for (const stream of userConnections) {
        void stream.push(serializedPayload)
    }
}
