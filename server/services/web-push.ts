import { In } from 'typeorm'
import webpush from 'web-push'
import { dataSource } from '@/server/database'
import { WebPushSubscription, type WebPushSubscriptionPayload } from '@/server/entities/web-push-subscription'
import { User } from '@/server/entities/user'
import { getSettings } from '@/server/services/setting'
import logger from '@/server/utils/logger'
import { SettingKey } from '@/types/setting'

interface WebPushMessage {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    url?: string | null
    data?: Record<string, unknown>
}

interface WebPushConfig {
    subject: string
    publicKey: string
    privateKey: string
}

let cachedConfigSignature: string | null = null

async function getWebPushConfig(): Promise<WebPushConfig | null> {
    const settings = await getSettings([
        SettingKey.WEB_PUSH_VAPID_SUBJECT,
        SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY,
        SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY,
    ])

    const subject = settings[SettingKey.WEB_PUSH_VAPID_SUBJECT]?.trim()
    const publicKey = settings[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]?.trim()
    const privateKey = settings[SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY]?.trim()

    if (!subject || !publicKey || !privateKey) {
        return null
    }

    return {
        subject,
        publicKey,
        privateKey,
    }
}

async function ensureWebPushConfigured() {
    const config = await getWebPushConfig()

    if (!config) {
        return null
    }

    const nextSignature = `${config.subject}:${config.publicKey}:${config.privateKey}`
    if (cachedConfigSignature !== nextSignature) {
        webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
        cachedConfigSignature = nextSignature
    }

    return config
}

async function removeSubscriptionsByEndpoints(endpoints: string[]) {
    if (!dataSource.isInitialized || endpoints.length === 0) {
        return 0
    }

    const repo = dataSource.getRepository(WebPushSubscription)
    const result = await repo.delete({ endpoint: In(endpoints) })
    return result.affected || 0
}

export async function isWebPushEnabled() {
    return Boolean(await ensureWebPushConfigured())
}

export async function upsertWebPushSubscription(options: {
    userId: string
    subscription: WebPushSubscriptionPayload
    permission?: string | null
    userAgent?: string | null
    locale?: string | null
}) {
    if (!dataSource.isInitialized) {
        return null
    }

    const userRepo = dataSource.getRepository(User)
    const userExists = await userRepo.exist({ where: { id: options.userId } })

    if (!userExists) {
        logger.warn(`[WebPush] Ignore subscription upsert for missing user ${options.userId}`)
        throw createError({
            statusCode: 401,
            statusMessage: 'User session is invalid',
        })
    }

    const repo = dataSource.getRepository(WebPushSubscription)
    let entity = await repo.findOne({
        where: { endpoint: options.subscription.endpoint },
    })

    if (!entity) {
        entity = repo.create()
    }

    entity.userId = options.userId
    entity.endpoint = options.subscription.endpoint
    entity.subscription = options.subscription
    entity.permission = options.permission ?? entity.permission ?? null
    entity.userAgent = options.userAgent ?? entity.userAgent ?? null
    entity.locale = options.locale ?? entity.locale ?? null

    return await repo.save(entity)
}

export async function removeWebPushSubscription(options: {
    userId: string
    endpoint?: string | null
}) {
    if (!dataSource.isInitialized || !options.endpoint) {
        return 0
    }

    const repo = dataSource.getRepository(WebPushSubscription)
    const result = await repo.delete({
        userId: options.userId,
        endpoint: options.endpoint,
    })

    return result.affected || 0
}

export async function sendWebPushToUser(userId: string, message: WebPushMessage) {
    const config = await ensureWebPushConfigured()
    if (!config || !dataSource.isInitialized) {
        return {
            attempted: 0,
            sent: 0,
            removed: 0,
            skipped: true,
        }
    }

    const repo = dataSource.getRepository(WebPushSubscription)
    const subscriptions = await repo.find({ where: { userId } })
    if (subscriptions.length === 0) {
        return {
            attempted: 0,
            sent: 0,
            removed: 0,
            skipped: true,
        }
    }

    const invalidEndpoints: string[] = []
    let sent = 0
    const payload = JSON.stringify({
        title: message.title,
        body: message.body,
        icon: message.icon || '/favicon.ico',
        badge: message.badge || '/favicon.ico',
        tag: message.tag,
        data: {
            ...(message.data || {}),
            url: message.url || '/',
        },
    })

    for (const item of subscriptions) {
        try {
            await webpush.sendNotification(item.subscription, payload, {
                TTL: 60 * 60,
                urgency: 'high',
            })
            sent += 1
        } catch (error) {
            const pushError = error as Error & { statusCode?: number }
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                invalidEndpoints.push(item.endpoint)
                logger.warn(`[WebPush] Removing expired subscription for user ${userId}`)
                continue
            }

            logger.error(`[WebPush] Failed to send notification to user ${userId}:`, error)
        }
    }

    const removed = await removeSubscriptionsByEndpoints(invalidEndpoints)

    return {
        attempted: subscriptions.length,
        sent,
        removed,
    }
}
